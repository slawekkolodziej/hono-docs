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
 * Process simple routes extracted from source code and add them to paths
 */
function processSimpleRoutes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  simpleRoutes: Record<string, Record<string, any>>,
  apiGroup: ApiGroup,
  docLookup: Map<string, import("../utils/middleware-docs").DocConfig>,
  paths: OpenAPI
): void {
  debug("Adding %d simple routes to paths", Object.keys(simpleRoutes).length);
  
  for (const [routePath, methods] of Object.entries(simpleRoutes)) {
    debug("Processing simple route: %s with apiPrefix: %s", routePath, apiGroup.apiPrefix);
    
    const prefixedPath = combinePathWithPrefix(apiGroup.apiPrefix, routePath);
    const normalizedPath = normalizePathToOpenApi(prefixedPath);
    debug("Route transformation: %s -> %s -> %s", routePath, prefixedPath, normalizedPath);
    
    if (!paths[normalizedPath]) {
      paths[normalizedPath] = {};
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const [method, operation] of Object.entries(methods as Record<string, any>)) {
      const docKey = `${method}:${routePath}`;
      const docConfig = docLookup.get(docKey);
      
      if (docConfig) {
        debug("Applying doc() middleware to simple route %s %s", method.toUpperCase(), routePath);
      }
      
      applyDocumentationToOperation(
        operation,
        docConfig,
        operation.summary,
        apiGroup.name
      );
      
      paths[normalizedPath][method] = operation;
    }
  }
}

/**
 * Process typed routes from TypeLiteral nodes and add them to paths
 */
function processTypedRoutes(
  literalsWithPrefixes: Array<{ literal: TypeLiteralNode; prefix: string }>,
  docLookup: Map<string, import("../utils/middleware-docs").DocConfig>,
  paths: OpenAPI
): void {
  for (const { literal: lit, prefix } of literalsWithPrefixes) {
    debug("Processing literal with prefix: %s", prefix);
    
    for (const member of lit.getMembers()) {
      if (!member.isKind(SyntaxKind.PropertySignature)) continue;
      const routeProp = member.asKindOrThrow(SyntaxKind.PropertySignature);
      
      // Extract route string and normalize to OpenAPI path syntax
      const raw = routeProp.getNameNode().getText().replace(/"/g, "");
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
          "API" // Will be overridden by docConfig.tags if present
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
        for (const [code, vs] of Object.entries(byStatus)) {
          const schemas = vs.map((v) =>
            buildSchema(
              v.getProperty("output")!.getValueDeclarationOrThrow().getType()
            )
          );
          const schema = schemas.length > 1 ? { oneOf: schemas } : schemas[0];
          op.responses[code] = {
            description:
              code === "default"
                ? `Default fallback response`
                : `Status ${code}`,
            content: { "application/json": { schema } },
          };
        }

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
    const originalSf = project.addSourceFileAtPath(
      path.resolve(rootPath, apiGroup.appTypePath)
    );
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
  sf: SourceFile,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any,
  rootPath: string,
  apiGroup: ApiGroup
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

  // Gather all TypeLiteralNodes with their prefixes (handle intersections)
  const literalsWithPrefixes: Array<{ literal: TypeLiteralNode; prefix: string }> = [];
  
  if (routesNode.isKind(SyntaxKind.IntersectionType)) {
    for (const tn of routesNode
      .asKind(SyntaxKind.IntersectionType)!
      .getTypeNodes()) {
      if (tn.isKind(SyntaxKind.TypeLiteral))
        literalsWithPrefixes.push({ literal: tn as TypeLiteralNode, prefix: "" });
    }
  } else if (routesNode.isKind(SyntaxKind.UnionType)) {
    // Handle unions (for grouped AppType)
    debug("Processing UnionType with %d members", routesNode.asKind(SyntaxKind.UnionType)!.getTypeNodes().length);

    const unionLiterals = extractTypeLiteralsFromUnion(routesNode);
    literalsWithPrefixes.push(...unionLiterals);
    debug("Extracted %d TypeLiteral nodes from union", unionLiterals.length);
  } else if (routesNode.isKind(SyntaxKind.TypeLiteral)) {
    literalsWithPrefixes.push({ literal: routesNode as TypeLiteralNode, prefix: "" });
  } else if (routesNode.isKind(SyntaxKind.ImportType)) {
    // Handle simple routes that generate BlankSchema (fallback to source parsing)  
    debug("Detected ImportType (likely BlankSchema), attempting source code parsing for simple routes");
    
    // Load the original source file (not the snapshot) to extract simple routes
    const originalSf = project.addSourceFileAtPath(
      path.resolve(rootPath, apiGroup.appTypePath)
    );
    const simpleRoutes = extractSimpleRoutesFromSource(originalSf);
    
    // Store the simple routes to add them directly to paths later
    if (Object.keys(simpleRoutes).length > 0) {
      debug("Found %d simple routes, will add directly to paths", Object.keys(simpleRoutes).length);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (literalsWithPrefixes as any).simpleRoutes = simpleRoutes;
    } else {
      debug("No simple routes found in source file");
    }
  } else {
    debug("Routes node kind: %s", routesNode.getKindName());
    debug("Routes node text: %s", routesNode.getText());
    throw new Error("Routes type is not a literal, intersection, or union of literals");
  }
  
  return literalsWithPrefixes;
}

/**
 * Extract simple routes from source code when type information is insufficient
 * This handles cases where simple Hono apps generate BlankSchema instead of typed routes
 */
function extractSimpleRoutesFromSource(
  sourceFile: SourceFile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, Record<string, any>> {
  debug("Parsing simple routes from source code");
  
  // Find all call expressions in the source file
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routes: Record<string, Record<string, any>> = {};
  
  for (const call of callExpressions) {
    try {
      const expression = call.getExpression();
      
      // Look for method access expressions like .get(), .post(), etc.
      if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
        const propertyAccess = expression.asKind(SyntaxKind.PropertyAccessExpression)!;
        const methodName = propertyAccess.getName().toLowerCase();
        
        // Check if it's an HTTP method
        const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
        if (httpMethods.includes(methodName)) {
          const args = call.getArguments();
          if (args.length >= 2) {
            const routeArg = args[0];
            
            // Extract the route path
            if (routeArg.getKind() === SyntaxKind.StringLiteral) {
              const routePath = routeArg.getText().replace(/['"]/g, '');
              const normalizedPath = routePath.replace(/:([^/]+)/g, '{$1}');
              
              if (!routes[normalizedPath]) {
                routes[normalizedPath] = {};
              }
              
              routes[normalizedPath][methodName] = {
                summary: `Auto-generated ${methodName.toUpperCase()} ${normalizedPath}`,
                responses: {
                  "default": {
                    description: "Default fallback response", 
                    content: {
                      "application/json": {
                        schema: { type: "object" }
                      }
                    }
                  }
                }
              };
              
              debug("Found simple route: %s %s", methodName.toUpperCase(), routePath);
            }
          }
        }
      }
    } catch (error) {
      debug("Error processing call expression: %s", error);
      continue;
    }
  }
  
  if (Object.keys(routes).length > 0) {
    debug("Successfully parsed %d routes from source", Object.keys(routes).length);
  } else {
    debug("No simple routes found in source");
  }
  
  return routes;
}

/**
 * CORE ALGORITHM: Extract TypeLiteral nodes with path prefixes from Hono's complex type structures
 * 
 * This is the heart of route extraction for grouped Hono apps. Hono's `.route()` method creates
 * complex nested type unions that represent grouped routes with path prefixes.
 * 
 * For example:
 * ```typescript
 * const app = new Hono()
 *   .route("/api", apiRoutes)    // Creates MergeSchemaPath<ApiSchema, "/api">
 *   .route("/auth", authRoutes)  // Creates MergeSchemaPath<AuthSchema, "/auth">
 * ```
 * 
 * This results in union types like:
 * BlankSchema | MergeSchemaPath<ApiSchema, "/api"> | MergeSchemaPath<AuthSchema, "/auth">
 * 
 * We need to:
 * 1. Skip BlankSchema (empty base schema)
 * 2. Extract schemas from MergeSchemaPath and combine them with their path prefixes
 * 3. Handle nested unions/intersections recursively
 * 4. Return all TypeLiteral nodes (route definitions) with their full path prefixes
 */
function extractTypeLiteralsFromUnion(unionNode: TypeNode, currentPrefix: string = ""): Array<{ literal: TypeLiteralNode; prefix: string }> {
  const literals: Array<{ literal: TypeLiteralNode; prefix: string }> = [];

  if (!unionNode.isKind(SyntaxKind.UnionType)) {
    return literals;
  }

  for (const member of unionNode.asKind(SyntaxKind.UnionType)!.getTypeNodes()) {
    debug("Processing union member: %s with prefix: %s", member.getKindName(), currentPrefix);

    if (member.isKind(SyntaxKind.TypeLiteral)) {
      debug("Found direct TypeLiteral in union");
      literals.push({ literal: member as TypeLiteralNode, prefix: currentPrefix });
    } else if (member.isKind(SyntaxKind.ImportType)) {
      // Handle ImportType with qualifier (like import("...").MergeSchemaPath)
      const importType = member.asKind(SyntaxKind.ImportType)!;
      const qualifier = importType.getQualifier();
      debug("ImportType qualifier: %s", qualifier?.getKindName());

      if (qualifier) {
        let qualifierName = "";
        if (qualifier.isKind(SyntaxKind.QualifiedName)) {
          const qualifiedName = qualifier.asKind(SyntaxKind.QualifiedName)!;
          qualifierName = qualifiedName.getRight().getText();
        } else if (qualifier.isKind(SyntaxKind.Identifier)) {
          qualifierName = qualifier.asKind(SyntaxKind.Identifier)!.getText();
        }
        debug("ImportType qualifier name: %s", qualifierName);

        // Only process MergeSchemaPath, skip BlankSchema
        if (qualifierName === "MergeSchemaPath") {
          const typeArgs = importType.getTypeArguments();
          debug("MergeSchemaPath typeArgs: %d", typeArgs.length);
          if (typeArgs.length >= 2) {
            const schema = typeArgs[0];
            const pathPrefix = typeArgs[1].getText().replace(/"/g, "");
            const fullPrefix = currentPrefix + pathPrefix;
            debug("Schema kind: %s with prefix: %s", schema.getKindName(), fullPrefix);

            if (schema.isKind(SyntaxKind.IntersectionType)) {
              debug("Processing IntersectionType with %d members", schema.asKind(SyntaxKind.IntersectionType)!.getTypeNodes().length);
              for (const intersectMember of schema.asKind(SyntaxKind.IntersectionType)!.getTypeNodes()) {
                debug("Intersection member kind: %s", intersectMember.getKindName());
                if (intersectMember.isKind(SyntaxKind.TypeLiteral)) {
                  debug("Found TypeLiteral in IntersectionType!");
                  literals.push({ literal: intersectMember as TypeLiteralNode, prefix: fullPrefix });
                } else {
                  debug("Non-TypeLiteral in intersection: %s", intersectMember.getKindName());
                }
              }
            } else if (schema.isKind(SyntaxKind.UnionType)) {
              // Handle nested unions (recursive case)
              const nestedLiterals = extractTypeLiteralsFromUnion(schema, fullPrefix);
              literals.push(...nestedLiterals);
            } else {
              // Recursively extract from the schema
              const nestedLiterals = extractTypeLiteralsFromUnion(schema, fullPrefix);
              debug("Found %d nested literals", nestedLiterals.length);
              literals.push(...nestedLiterals);
            }
          }
        } else {
          debug("Skipping non-MergeSchemaPath: %s", qualifierName);
        }
        // BlankSchema is intentionally skipped (empty schema)
      }
    } else if (member.isKind(SyntaxKind.IntersectionType)) {
      debug("Processing IntersectionType in union");
      // Handle intersections within unions
      for (const intersectMember of member.asKind(SyntaxKind.IntersectionType)!.getTypeNodes()) {
        debug("Intersection member: %s", intersectMember.getKindName());
        if (intersectMember.isKind(SyntaxKind.TypeLiteral)) {
          debug("Found TypeLiteral in intersection");
          literals.push({ literal: intersectMember as TypeLiteralNode, prefix: currentPrefix });
        }
      }
    } else {
      debug("Ignoring union member type: %s", member.getKindName());
    }
  }

  return literals;
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
  const sf = project.addSourceFileAtPath(
    path.resolve(rootPath, snapshotPath.appTypePath)
  );
  
  // Extract documentation from doc() middleware
  const docLookup = loadDocumentationFromMiddleware(project, rootPath, apiGroup);
  
  // Parse TypeScript AppType to extract route information  
  const literalsWithPrefixes = parseAppTypeRoutes(sf, project, rootPath, apiGroup);

  const paths: OpenAPI = {};

  // Add simple routes if we found any (BlankSchema fallback case)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simpleRoutes = (literalsWithPrefixes as any).simpleRoutes;
  if (simpleRoutes) {
    processSimpleRoutes(simpleRoutes, apiGroup, docLookup, paths);
  }

  // Process typed routes from TypeLiteral nodes
  processTypedRoutes(literalsWithPrefixes, docLookup, paths);

  const spec = {
    ...config.openApi,
    paths,
  };

  // write to disk
  const outputPath = path.join(outputRoot, `${fileName}.json`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), "utf-8");
  debug("Generated OpenAPI spec for %s -> %s", apiGroup.appTypePath, outputPath);
  return { openApiPath: outputPath };
}