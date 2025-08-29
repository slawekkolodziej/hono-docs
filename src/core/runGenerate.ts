import fs from "node:fs";
import path, { resolve } from "node:path";
import createDebug from "debug";
import { Project } from "ts-morph";
import { loadConfig } from "../config/loadConfig";
import { generateTypes } from "./generateTypes";
import { generateOpenApi } from "./generateOpenApi";
import { Api } from "../types";
import { cleanDefaultResponse } from "../utils/format";
import { getLibDir } from "../utils/libDir";

const debug = createDebug("hono-docs");

/**
 * Generate a safe filename from API group name
 */
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function runGenerate(configPath: string) {
  const config = await loadConfig(configPath);

  const rootPath = process.cwd();
  debug("Initializing ts-morph with tsConfig: %s", config.tsConfigPath);
  const project = new Project({
    tsConfigFilePath: resolve(rootPath, config.tsConfigPath),
  });

  // const isDevMode =
  //   __dirname.includes("/src/") || __dirname.includes("\\src\\");

  // const libDir = isDevMode
  //   ? path.resolve(__dirname, "../../")
  //   : // : path.dirname(require.resolve("@rcmade/hono-docs/package.json"));
  //     path.dirname(fileURLToPath(import.meta.url));
  const libDir = getLibDir();
  debug("Library root directory: %s", libDir);

  // Create a single API group from the flattened config
  const apiGroup = {
    name: config.name,
    appTypePath: config.appTypePath,
    api: config.api,
    excludePaths: config.excludePaths,
  };

  const snapshotOutputRoot = path.resolve(libDir, "output/types");
  const openAPiOutputRoot = path.resolve(libDir, "output/openapi");

  const commonParams = {
    config,
    libDir,
    project,
    rootPath,
  };
  
  const sanitizedName = sanitizeFileName(apiGroup.name);

  const snapshotPath = await generateTypes({
    ...commonParams,
    apiGroup: apiGroup,
    fileName: sanitizedName,
    outputRoot: snapshotOutputRoot,
  });

   debug("About to call generateOpenApi for: %s (source: %s)", snapshotPath.appTypePath, apiGroup.appTypePath);
   await generateOpenApi({
     snapshotPath,
     apiGroup,
     ...commonParams,
     fileName: sanitizedName,
     outputRoot: openAPiOutputRoot,
   });
   debug("generateOpenApi completed for: %s", apiGroup.appTypePath);

  // Load the generated OpenAPI file
  const name = sanitizeFileName(apiGroup.name);
  const openApiFile = path.join(openAPiOutputRoot, `${name}.json`);

  if (!fs.existsSync(openApiFile)) {
    throw new Error(`Missing OpenAPI file: ${openApiFile}`);
  }

  const json = JSON.parse(fs.readFileSync(openApiFile, "utf-8"));
  
  const merged = {
    ...config.openApi,
    tags: [{ name: apiGroup.name }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paths: {} as Record<string, any>,
  };

  const customApiMap = new Map<string, Api>();

  if (apiGroup?.api) {
    for (const customApi of apiGroup.api) {
      const fullPath = customApi.api.replace(/\/+$/, "") || "/";
      customApiMap.set(
        `${customApi.method.toLowerCase()} ${fullPath}`,
        customApi
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [pathKey, operations] of Object.entries<any>(json.paths)) {
    // Paths now come directly from Hono routes (no additional prefixing)
    const apiPath = pathKey;
    
    if (!merged.paths[apiPath]) merged.paths[apiPath] = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const [method, operation] of Object.entries<any>(operations)) {
      const opKey = `${method.toLowerCase()} ${apiPath}`;
      const customApi = customApiMap.get(opKey);

      // Override or enrich metadata if defined
      if (customApi) {
        operation.summary = customApi.summary || operation.summary;
        operation.description =
          customApi.description || operation.description;
        operation.tags =
          customApi.tag && customApi.tag.length > 0
            ? customApi.tag
            : [apiGroup.name];
      } else {
        operation.tags = operation.tags || [];
        if (!operation.tags.includes(apiGroup.name)) {
          operation.tags.push(apiGroup.name);
        }
      }

      cleanDefaultResponse(operation, apiPath, method);
      merged.paths[apiPath][method] = operation;
    }
  }

  const outputPath = path.join(rootPath, config.outputs.openApiJson);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  fs.writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`);

  console.log(`✅ OpenAPI spec written to: ${outputPath}`);
}
