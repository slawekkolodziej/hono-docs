// src/core/generateOpenApi.ts
import fs from "node:fs";
import path from "node:path";
import createDebug from "debug";
import {
  SyntaxKind,
  TypeLiteralNode,
  ImportTypeNode,
  TypeReferenceNode,
  TypeNode,
  ts,
} from "ts-morph";
import type {
  AppTypeSnapshotPath,
  GenerateParams,
  OpenApiPath,
  ApiGroup,
} from "../types";
import type { SourceFile } from "ts-morph";
import { genParameters } from "../utils/parameters";
import { genRequestBody } from "../utils/requestBody";
import { buildSchema } from "../utils/buildSchema";
import { groupBy, unwrapUnion } from "../utils/format";
import { extractDocumentationFromMiddleware, createDocLookup } from "../utils/middleware-docs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenAPI = Record<string, any>;

// Debug logging using standard debug package
// Usage: DEBUG=hono-docs or DEBUG=* 
const debug = createDebug("hono-docs");

/**
 * Normalize path by converting :param syntax to {param} OpenAPI syntax
 */
function normalizePathToOpenApi(path: string): string {
  return path.replace(/:([^/]+)/g, '{$1}');
}

/**
 * Check if a path should be excluded from OpenAPI generation
 */
function isPathExcluded(path: string, excludePaths?: (string | RegExp)[]): boolean {
  if (!excludePaths || excludePaths.length === 0) {
    return false;
  }

  return excludePaths.some(exclude => {
    if (typeof exclude === 'string') {
      return path === exclude || path.endsWith(exclude);
    }
    // RegExp case
    return exclude.test(path);
  });
}

/**
 * Combine path prefix with route path, avoiding double slashes
 */
function combinePathWithPrefix(prefix: string, routePath: string): string {
  if (prefix === "/" || prefix === "") {
    return routePath;
  }
  if (routePath === "/") {
    return prefix;
  }
  return prefix + (routePath.startsWith("/") ? routePath : "/" + routePath);
}

/**
 * Apply documentation from doc() middleware to an operation
 */
function applyDocumentationToOperation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operation: any,
  docConfig: import("../utils/middleware-docs").DocConfig | undefined,
  fallbackSummary: string,
  apiGroupName: string
): void {
  if (docConfig) {
    operation.summary = docConfig.summary || fallbackSummary;
    if (docConfig.description) operation.description = docConfig.description;
    if (docConfig.tags && docConfig.tags.length > 0) operation.tags = docConfig.tags;
    if (docConfig.deprecated) operation.deprecated = true;
  } else {
    operation.summary = fallbackSummary;
    operation.tags = [apiGroupName];
  }
}

/**
 * Process typed routes from TypeLiteral nodes and add them to paths
 */
function processTypedRoutes(
  literalsWithPrefixes: Array<{ literal: TypeLiteralNode; prefix: string }>,
  docLookup: Map<string, import("../utils/middleware-docs").DocConfig>,
  paths: OpenAPI,
  apiGroup: ApiGroup
): void {
  for (const { literal: lit, prefix } of literalsWithPrefixes) {
    debug("Processing literal with prefix: %s", prefix);
    
    for (const member of lit.getMembers()) {
      if (!member.isKind(SyntaxKind.PropertySignature)) continue;
      const routeProp = member.asKindOrThrow(SyntaxKind.PropertySignature);
      
      // Extract route string and normalize to OpenAPI path syntax
      const raw = routeProp.getNameNode().getText().replace(/"/g, "");
      
      // Check if this route should be excluded
      if (isPathExcluded(raw, apiGroup.excludePaths)) {
        debug("Excluding typed route: %s", raw);
        continue;
      }
      
      const routeWithPrefix = combinePathWithPrefix(prefix, raw);
      const route = normalizePathToOpenApi(routeWithPrefix);
      
      debug("Processing route: %s -> %s -> %s", raw, routeWithPrefix, route);
      if (!paths[route]) paths[route] = {};

      // Get the RHS TypeLiteralNode properly
      const tn = routeProp.getTypeNode();
      if (!tn || !tn.isKind(SyntaxKind.TypeLiteral)) continue;
      const rhs = tn as TypeLiteralNode;

      for (const m of rhs.getMembers()) {
        if (!m.isKind(SyntaxKind.PropertySignature)) continue;
        const methodProp = m.asKindOrThrow(SyntaxKind.PropertySignature);
        const name = methodProp.getNameNode().getText(); // e.g. "$get"
        const http = name.slice(1).toLowerCase(); // "get", "post", etc.
        const variants = unwrapUnion(methodProp.getType());

        // Check for doc() middleware documentation for this route and method
        const docKey = `${http}:${raw}`; // Use the original route, not the prefixed one
        const docConfig = docLookup.get(docKey);
        
        debug("Looking for doc() middleware with key: %s", docKey);
        if (docConfig) {
          debug("Found doc() middleware for %s %s: %o", http.toUpperCase(), raw, docConfig);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const op: any = {};
        
        applyDocumentationToOperation(
          op,
          docConfig,
          `Auto-generated ${http.toUpperCase()} ${route}`,
          apiGroup.name
        );

        // parameters
        const params = genParameters(variants[0]);
        if (params.length) op.parameters = params;

        // requestBody
        const rb = genRequestBody(variants[0]);
        if (rb) op.requestBody = rb;

        // responses
        op.responses = {};
        const byStatus = groupBy(variants, (v) => {
          const s = v
            .getProperty("status")!
            .getValueDeclarationOrThrow()
            .getType()
            .getText();
          return /^\d+$/.test(s) ? s : "default";
        });
        
        // Convert 'default' to '200' when appropriate and sort responses numerically
        const responseEntries = Object.entries(byStatus);
        const hasExplicitSuccess = responseEntries.some(([code]) => code === "200");
        
        for (const [code, vs] of responseEntries) {
          const schemas = vs.map((v) =>
            buildSchema(
              v.getProperty("output")!.getValueDeclarationOrThrow().getType()
            )
          );
          const schema = schemas.length > 1 ? { oneOf: schemas } : schemas[0];
          
          // Convert 'default' to '200' if no explicit 200 exists
          const responseCode = (code === "default" && !hasExplicitSuccess) ? "200" : code;
          
          op.responses[responseCode] = {
            description:
              responseCode === "200" && code === "default"
                ? `Success response`
                : responseCode === "default"
                ? `Default fallback response`
                : `Status ${responseCode}`,
            content: { "application/json": { schema } },
          };
        }

        // Sort responses numerically (2xx, 3xx, 4xx, 5xx, then 'default' if any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sortedResponses: Record<string, any> = {};
        const responseCodes = Object.keys(op.responses).sort((a, b) => {
          if (a === "default") return 1;
          if (b === "default") return -1;
          return parseInt(a) - parseInt(b);
        });
        
        for (const code of responseCodes) {
          sortedResponses[code] = op.responses[code];
        }
        op.responses = sortedResponses;

        paths[route][http] = op;
      }
    }
  }
}

/**
 * Load documentation from doc() middleware in the source file
 */
function loadDocumentationFromMiddleware(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any,
  rootPath: string,
  apiGroup: ApiGroup
): Map<string, import("../utils/middleware-docs").DocConfig> {
  debug("Extracting documentation from middleware in source file: %s", apiGroup.appTypePath);
  
  try {
    const originalPath = path.resolve(rootPath, apiGroup.appTypePath);
    
    // Remove any existing source file from the project to avoid cached AST data
    const existingOriginalFile = project.getSourceFile(originalPath);
    if (existingOriginalFile) {
      project.removeSourceFile(existingOriginalFile);
      debug("Removed cached original source file from ts-morph project: %s", originalPath);
    }
    
    const originalSf = project.addSourceFileAtPath(originalPath);
    const documentation = extractDocumentationFromMiddleware(originalSf);
    const docLookup = createDocLookup(documentation);
    debug("Found %d routes with doc() middleware", documentation.length);
    return docLookup;
  } catch (error) {
    console.warn(`⚠️ Failed to extract documentation from middleware: ${error}`);
    console.warn(`⚠️ Continuing with auto-generated documentation only`);
    return new Map<string, import("../utils/middleware-docs").DocConfig>();
  }
}

/**
 * Parse TypeScript AppType to extract route type information
 */
function parseAppTypeRoutes(
  sf: SourceFile
): Array<{ literal: TypeLiteralNode; prefix: string }> {
  const aliasDecl = sf.getTypeAliasOrThrow("AppType");
  const topTypeNode = aliasDecl.getTypeNode();
  
  let typeArgs: readonly TypeNode<ts.TypeNode>[];

  if (topTypeNode?.isKind(SyntaxKind.TypeReference)) {
    typeArgs = (topTypeNode as TypeReferenceNode).getTypeArguments();
  } else if (topTypeNode?.isKind(SyntaxKind.ImportType)) {
    typeArgs = (topTypeNode as ImportTypeNode).getTypeArguments();
  } else {
    throw new Error("AppType must be an ImportType or a TypeReference");
  }

  if (typeArgs.length < 2) {
    throw new Error("Expected two type arguments on HonoBase");
  }

  const routesNode = typeArgs[1];
  
  debug("Routes node kind: %s", routesNode.getKindName());
  debug("Routes node text sample: %s", routesNode.getText().substring(0, 200));

  // Extract all route nodes using the clean recursive approach
  const literalsWithPrefixes = extractRouteNodes(routesNode);
  debug("Extracted %d TypeLiteral nodes total", literalsWithPrefixes.length);
  
  return literalsWithPrefixes;
}

/**
 * Clean recursive approach to extract route nodes from any TypeScript type structure.
 * This replaces the complex, hardcoded logic with a simple tree walk.
 */
interface RouteNode {
  literal: TypeLiteralNode;
  prefix: string;
}

/**
 * Recursively extract all TypeLiteral nodes with their prefixes from a type node.
 * Handles all TypeScript AST constructs: unions, intersections, parentheses, and MergeSchemaPath.
 */
function extractRouteNodes(node: TypeNode, currentPrefix: string = ""): RouteNode[] {
  debug("Extracting from node: %s with prefix: '%s'", node.getKindName(), currentPrefix);

  // Base case: TypeLiteral contains the actual route definitions
  if (node.isKind(SyntaxKind.TypeLiteral)) {
    debug("Found TypeLiteral with prefix: '%s'", currentPrefix);
    return [{ literal: node as TypeLiteralNode, prefix: currentPrefix }];
  }

  // Recursive cases: traverse the tree structure
  if (node.isKind(SyntaxKind.UnionType)) {
    debug("Processing UnionType with %d members", node.asKind(SyntaxKind.UnionType)!.getTypeNodes().length);
    return node.asKind(SyntaxKind.UnionType)!.getTypeNodes()
      .flatMap(child => extractRouteNodes(child, currentPrefix));
  }

  if (node.isKind(SyntaxKind.IntersectionType)) {
    debug("Processing IntersectionType with %d members", node.asKind(SyntaxKind.IntersectionType)!.getTypeNodes().length);
    return node.asKind(SyntaxKind.IntersectionType)!.getTypeNodes()
      .flatMap(child => extractRouteNodes(child, currentPrefix));
  }

  if (node.isKind(SyntaxKind.ParenthesizedType)) {
    debug("Processing ParenthesizedType");
    const innerNode = node.asKind(SyntaxKind.ParenthesizedType)!.getTypeNode();
    return extractRouteNodes(innerNode, currentPrefix);
  }

  // Special case: MergeSchemaPath adds a path prefix
  if (node.isKind(SyntaxKind.ImportType)) {
    return handleMergeSchemaPath(node.asKind(SyntaxKind.ImportType)!, currentPrefix);
  }

  debug("Ignoring node type: %s", node.getKindName());
  return [];
}

/**
 * Handle MergeSchemaPath<Schema, "/prefix"> by extracting the schema and adding the prefix.
 */
function handleMergeSchemaPath(importType: ImportTypeNode, currentPrefix: string): RouteNode[] {
  const qualifier = importType.getQualifier();
  if (!qualifier) return [];

  let qualifierName = "";
  if (qualifier.isKind(SyntaxKind.QualifiedName)) {
    qualifierName = qualifier.asKind(SyntaxKind.QualifiedName)!.getRight().getText();
  } else if (qualifier.isKind(SyntaxKind.Identifier)) {
    qualifierName = qualifier.asKind(SyntaxKind.Identifier)!.getText();
  }

  if (qualifierName !== "MergeSchemaPath") {
    debug("Ignoring ImportType with qualifier: %s", qualifierName);
    return [];
  }

  const typeArgs = importType.getTypeArguments();
  if (typeArgs.length < 2) {
    debug("MergeSchemaPath has insufficient type args: %d", typeArgs.length);
    return [];
  }

  const schema = typeArgs[0];
  const pathPrefix = typeArgs[1].getText().replace(/"/g, "");
  const fullPrefix = currentPrefix + pathPrefix;

  debug("Processing MergeSchemaPath with prefix: '%s' -> '%s'", pathPrefix, fullPrefix);
  return extractRouteNodes(schema, fullPrefix);
}

/**
 * MAIN FUNCTION: Generate OpenAPI specification from Hono AppType
 * 
 * This function orchestrates the entire OpenAPI generation process:
 * 1. Load and parse TypeScript source files
 * 2. Extract documentation from doc() middleware (if present)
 * 3. Parse the Hono AppType to extract route type information
 * 4. Convert TypeScript route types to OpenAPI paths/operations
 * 5. Generate response schemas and request/response examples
 * 6. Write the final OpenAPI JSON specification to disk
 * 
 * @param config - Hono-docs configuration with OpenAPI metadata
 * @param snapshotPath - Path information for the generated AppType snapshot
 * @param apiGroup - API group configuration with route patterns
 * @param fileName - Output filename for the OpenAPI JSON
 * @param project - ts-morph Project instance for TypeScript analysis
 * @param rootPath - Root directory path for resolving relative paths  
 * @param outputRoot - Output directory for generated files
 * @returns Promise resolving to the output path information
 */
export async function generateOpenApi({
  config,
  snapshotPath,
  apiGroup,
  fileName,
  project,
  rootPath,
  outputRoot,
}: GenerateParams & {
  snapshotPath: AppTypeSnapshotPath;
  apiGroup: ApiGroup;
}): Promise<OpenApiPath> {
  const targetPath = path.resolve(rootPath, snapshotPath.appTypePath);
  
  // Remove any existing source file from the project to avoid cached AST data
  const existingFile = project.getSourceFile(targetPath);
  if (existingFile) {
    project.removeSourceFile(existingFile);
    debug("Removed cached source file from ts-morph project: %s", targetPath);
  }
  
  const sf = project.addSourceFileAtPath(targetPath);
  
  // Extract documentation from doc() middleware
  const docLookup = loadDocumentationFromMiddleware(project, rootPath, apiGroup);
  
  // Parse TypeScript AppType to extract route information  
  const literalsWithPrefixes = parseAppTypeRoutes(sf);

  const paths: OpenAPI = {};

  // Process typed routes from TypeLiteral nodes
  processTypedRoutes(literalsWithPrefixes, docLookup, paths, apiGroup);

  const spec = {
    ...config.openApi,
    paths,
  };

  // write to disk
  const outputPath = path.join(outputRoot, `${fileName}.json`);

  // Clean up any existing file first to avoid stale data
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
    debug("Removed existing OpenAPI file: %s", outputPath);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), "utf-8");
  debug("Generated OpenAPI spec for %s -> %s", apiGroup.appTypePath, outputPath);
  return { openApiPath: outputPath };
}