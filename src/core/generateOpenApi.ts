// src/core/generateOpenApi.ts
import fs from "node:fs";
import path from "node:path";
import createDebug from "debug";
import { Type } from "ts-morph";
import type {
  AppTypeSnapshotPath,
  GenerateParams,
  OpenApiPath,
  ApiGroup,
} from "../types";
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
 * Process route schema from the TypeScript checker instead of parsing a serialized .d.ts AST.
 */
function processInferredRoutes(
  schemaType: Type,
  typeLocation: import("ts-morph").Node,
  docLookup: Map<string, import("../utils/middleware-docs").DocConfig>,
  paths: OpenAPI,
  apiGroup: ApiGroup
): void {
  for (const routeSymbol of schemaType.getProperties()) {
    const raw = routeSymbol.getName();

    if (!raw.startsWith("/")) continue;
    if (isPathExcluded(raw, apiGroup.excludePaths)) {
      debug("Excluding inferred route: %s", raw);
      continue;
    }

    const route = normalizePathToOpenApi(raw);
    if (!paths[route]) paths[route] = {};

    const routeType = routeSymbol.getTypeAtLocation(typeLocation);

    for (const methodSymbol of routeType.getProperties()) {
      const name = methodSymbol.getName();
      if (!name.startsWith("$")) continue;

      const http = name.slice(1).toLowerCase();
      const methodType = methodSymbol.getTypeAtLocation(typeLocation);
      const variants = unwrapUnion(methodType);

      const docKey = `${http}:${raw}`;
      const docConfig = docLookup.get(docKey);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const op: any = {};

      applyDocumentationToOperation(
        op,
        docConfig,
        `Auto-generated ${http.toUpperCase()} ${route}`,
        apiGroup.name
      );

      const params = genParameters(variants[0], typeLocation);
      if (params.length) op.parameters = params;

      const rb = genRequestBody(variants[0], typeLocation);
      if (rb) op.requestBody = rb;

      op.responses = {};
      const byStatus = groupBy(variants, (v) => {
        const status = v.getProperty("status");
        if (!status) return "default";
        const statusType = status.getTypeAtLocation(typeLocation).getText();
        return /^\d+$/.test(statusType) ? statusType : "default";
      });

      const responseEntries = Object.entries(byStatus);
      const hasExplicitSuccess = responseEntries.some(([code]) => code === "200");

      for (const [code, vs] of responseEntries) {
        const schemas = vs.map((v) => {
          const output = v.getProperty("output");
          return buildSchema(output ? output.getTypeAtLocation(typeLocation) : v, typeLocation);
        });
        const schema = schemas.length > 1 ? { oneOf: schemas } : schemas[0];
        const responseCode = code === "default" && !hasExplicitSuccess ? "200" : code;

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

function getInferredSchemaType(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any,
  rootPath: string,
  apiGroup: ApiGroup
): { schemaType: Type; typeLocation: import("ts-morph").Node } {
  const originalPath = path.resolve(rootPath, apiGroup.appTypePath);
  const existingOriginalFile = project.getSourceFile(originalPath);
  if (existingOriginalFile) {
    project.removeSourceFile(existingOriginalFile);
  }

  const originalSf = project.addSourceFileAtPath(originalPath);
  const appTypeAlias = originalSf.getTypeAliasOrThrow("AppType");
  const inferredAliasName = "__HonoDocsInferredSchema";
  originalSf.getTypeAlias(inferredAliasName)?.remove();
  const inferredAlias = originalSf.addTypeAlias({
    name: inferredAliasName,
    type: `import("hono/types").ExtractSchema<${appTypeAlias.getName()}>`,
  });

  return {
    schemaType: inferredAlias.getType(),
    typeLocation: inferredAlias,
  };
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
    
    project.addSourceFileAtPath(originalPath);
    const sourceRoot = path.resolve(rootPath);
    const documentation = project
      .getSourceFiles()
      .filter((sourceFile: import("ts-morph").SourceFile) => {
        const filePath = sourceFile.getFilePath();
        return filePath.startsWith(sourceRoot) && !filePath.includes("/node_modules/");
      })
      .flatMap((sourceFile: import("ts-morph").SourceFile) =>
        extractDocumentationFromMiddleware(sourceFile)
      );
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
  apiGroup,
  fileName,
  project,
  rootPath,
  outputRoot,
}: GenerateParams & {
  snapshotPath: AppTypeSnapshotPath;
  apiGroup: ApiGroup;
}): Promise<OpenApiPath> {
  // Extract documentation from doc() middleware
  const docLookup = loadDocumentationFromMiddleware(project, rootPath, apiGroup);

  const paths: OpenAPI = {};

  // Process the public Hono route schema from TypeScript's checker.
  const { schemaType, typeLocation } = getInferredSchemaType(
    project,
    rootPath,
    apiGroup
  );
  processInferredRoutes(schemaType, typeLocation, docLookup, paths, apiGroup);

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
