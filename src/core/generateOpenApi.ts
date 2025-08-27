// src/core/generateOpenApi.ts
import fs from "node:fs";
import path from "node:path";
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
import { genParameters } from "../utils/parameters";
import { genRequestBody } from "../utils/requestBody";
import { buildSchema } from "../utils/buildSchema";
import { groupBy, unwrapUnion } from "../utils/format";
import { extractDocumentationFromMiddleware, createDocLookup } from "../utils/middleware-docs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenAPI = Record<string, any>;

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
    console.log("🔍 Processing union member:", member.getKindName(), "with prefix:", currentPrefix);

    if (member.isKind(SyntaxKind.TypeLiteral)) {
      console.log("🔍 Found direct TypeLiteral in union");
      literals.push({ literal: member as TypeLiteralNode, prefix: currentPrefix });
    } else if (member.isKind(SyntaxKind.ImportType)) {
      // Handle ImportType with qualifier (like import("...").MergeSchemaPath)
      const importType = member.asKind(SyntaxKind.ImportType)!;
      const qualifier = importType.getQualifier();
      console.log("🔍 ImportType qualifier:", qualifier?.getKindName());

      if (qualifier) {
        let qualifierName = "";
        if (qualifier.isKind(SyntaxKind.QualifiedName)) {
          const qualifiedName = qualifier.asKind(SyntaxKind.QualifiedName)!;
          qualifierName = qualifiedName.getRight().getText();
        } else if (qualifier.isKind(SyntaxKind.Identifier)) {
          qualifierName = qualifier.asKind(SyntaxKind.Identifier)!.getText();
        }
        console.log("🔍 ImportType qualifier name:", qualifierName);

        // Only process MergeSchemaPath, skip BlankSchema
        if (qualifierName === "MergeSchemaPath") {
          const typeArgs = importType.getTypeArguments();
          console.log("🔍 MergeSchemaPath typeArgs:", typeArgs.length);
          if (typeArgs.length >= 2) {
            const schema = typeArgs[0];
            const pathPrefix = typeArgs[1].getText().replace(/"/g, "");
            const fullPrefix = currentPrefix + pathPrefix;
            console.log("🔍 Schema kind:", schema.getKindName(), "with prefix:", fullPrefix);

            if (schema.isKind(SyntaxKind.IntersectionType)) {
              console.log("🔍 Processing IntersectionType with", schema.asKind(SyntaxKind.IntersectionType)!.getTypeNodes().length, "members");
              for (const intersectMember of schema.asKind(SyntaxKind.IntersectionType)!.getTypeNodes()) {
                console.log("🔍 Intersection member kind:", intersectMember.getKindName());
                if (intersectMember.isKind(SyntaxKind.TypeLiteral)) {
                  console.log("🔍 Found TypeLiteral in IntersectionType!");
                  literals.push({ literal: intersectMember as TypeLiteralNode, prefix: fullPrefix });
                } else {
                  console.log("🔍 Non-TypeLiteral in intersection:", intersectMember.getKindName());
                }
              }
            } else if (schema.isKind(SyntaxKind.UnionType)) {
              // Handle nested unions (recursive case)
              const nestedLiterals = extractTypeLiteralsFromUnion(schema, fullPrefix);
              literals.push(...nestedLiterals);
            } else {
              // Recursively extract from the schema
              const nestedLiterals = extractTypeLiteralsFromUnion(schema, fullPrefix);
              console.log("🔍 Found", nestedLiterals.length, "nested literals");
              literals.push(...nestedLiterals);
            }
          }
        } else {
          console.log("🔍 Skipping non-MergeSchemaPath:", qualifierName);
        }
        // BlankSchema is intentionally skipped (empty schema)
      }
    } else if (member.isKind(SyntaxKind.IntersectionType)) {
      console.log("🔍 Processing IntersectionType in union");
      // Handle intersections within unions
      for (const intersectMember of member.asKind(SyntaxKind.IntersectionType)!.getTypeNodes()) {
        console.log("🔍 Intersection member:", intersectMember.getKindName());
        if (intersectMember.isKind(SyntaxKind.TypeLiteral)) {
          console.log("🔍 Found TypeLiteral in intersection");
          literals.push({ literal: intersectMember as TypeLiteralNode, prefix: currentPrefix });
        }
      }
    } else {
      console.log("🔍 Ignoring union member type:", member.getKindName());
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
  
  // Extract documentation from doc() middleware in the original source file
  console.log("🔍 Extracting documentation from middleware in source file:", apiGroup.appTypePath);
  let docLookup = new Map<string, import("../utils/middleware-docs").DocConfig>();
  
  try {
    const originalSf = project.addSourceFileAtPath(
      path.resolve(rootPath, apiGroup.appTypePath)
    );
    const documentation = extractDocumentationFromMiddleware(originalSf);
    docLookup = createDocLookup(documentation);
    console.log(`🔍 Found ${documentation.length} routes with doc() middleware`);
  } catch (error) {
    console.warn(`⚠️ Failed to extract documentation from middleware: ${error}`);
    console.warn(`⚠️ Continuing with auto-generated documentation only`);
  }
  
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
    console.log("🔍 Processing UnionType with", routesNode.asKind(SyntaxKind.UnionType)!.getTypeNodes().length, "members");

    const unionLiterals = extractTypeLiteralsFromUnion(routesNode);
    literalsWithPrefixes.push(...unionLiterals);
    console.log("🔍 Extracted", unionLiterals.length, "TypeLiteral nodes from union");
  } else if (routesNode.isKind(SyntaxKind.TypeLiteral)) {
    literalsWithPrefixes.push({ literal: routesNode as TypeLiteralNode, prefix: "" });
  } else {
    console.log("🔍 Routes node kind:", routesNode.getKindName());
    console.log("🔍 Routes node text:", routesNode.getText());
    throw new Error("Routes type is not a literal, intersection, or union of literals");
  }

  const paths: OpenAPI = {};

  for (const { literal: lit, prefix } of literalsWithPrefixes) {
    console.log("🔍 Processing literal with prefix:", prefix);
    for (const member of lit.getMembers()) {
      if (!member.isKind(SyntaxKind.PropertySignature)) continue;
      const routeProp = member.asKindOrThrow(SyntaxKind.PropertySignature);
      // Extract route string and normalize to OpenAPI path syntax
      const raw = routeProp.getNameNode().getText().replace(/"/g, "");
      // Normalize path concatenation to avoid double slashes
      const routeWithPrefix = (prefix === "/" || prefix === "") 
        ? raw 
        : prefix + raw;
      const route = routeWithPrefix.replace(/:([^/]+)/g, "{$1}");
      console.log("🔍 Processing route:", raw, "->", routeWithPrefix, "->", route);
      if (!paths[route]) paths[route] = {};

      // === NEW: get the RHS TypeLiteralNode properly ===
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
        
        console.log(`🔍 Looking for doc() middleware with key: ${docKey}`);
        if (docConfig) {
          console.log(`🔍 Found doc() middleware for ${http.toUpperCase()} ${raw}:`, docConfig);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const op: any = {
          summary: docConfig?.summary || `Auto-generated ${http.toUpperCase()} ${route}`,
        };
        
        // Add description if available from doc() middleware
        if (docConfig?.description) {
          op.description = docConfig.description;
        }
        
        // Add tags if available from doc() middleware
        if (docConfig?.tags && docConfig.tags.length > 0) {
          op.tags = docConfig.tags;
        }
        
        // Mark as deprecated if specified in doc() middleware
        if (docConfig?.deprecated) {
          op.deprecated = true;
        }

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

  const spec = {
    ...config.openApi,
    paths,
  };

  // write to disk
  const outputPath = path.join(outputRoot, `${fileName}.json`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), "utf-8");
  console.log(`✅ OpenAPI written to ${outputPath}`);
  return { openApiPath: outputPath };
}