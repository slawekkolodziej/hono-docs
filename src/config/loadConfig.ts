import { resolve, extname } from "path";
import { existsSync } from "fs";
import { pathToFileURL,  } from "url";
import { register } from "esbuild-register/dist/node";
import type { HonoDocsConfig } from "../types";

export async function loadConfig(configFile: string): Promise<HonoDocsConfig> {
  // 1. Resolve absolute path
  const fullPath = resolve(process.cwd(), configFile);

  if (!existsSync(fullPath)) {
    throw new Error(`[hono-docs] Config file not found: ${fullPath}`);
  }

  // 2. Detect file extension
  const ext = extname(fullPath);
  let unregister: () => void = () => {};

  // 3. Register TS transpiler if needed
  if (ext === ".ts" || ext === ".tsx" || ext === ".mts") {
    ({ unregister } = register({
      target: "es2020",
      jsx: "automatic",
    }));
  }

  // 4. Dynamically import config
  let configModule: unknown;
  try {
    if (ext === ".mjs" || ext === ".mts") {
      // ESM config
      configModule = await import(pathToFileURL(fullPath).href);
    } else {
      // Fallback to dynamic import (will use CommonJS or TS via esbuild-register)
      configModule = await import(fullPath);
    }
  } catch (err) {
    unregister();
    throw new Error(
      `[hono-docs] Failed to load config: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  // 5. Cleanup esbuild hook
  unregister();

  // 6. Support both `export default` and CommonJS `module.exports`
  const config =
    configModule &&
    typeof configModule === "object" &&
    "default" in configModule
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (configModule as any).default
      : configModule;

  if (!config || typeof config !== "object") {
    throw new Error(
      `[hono-docs] Invalid config file. Expected an object, got: ${typeof config}`
    );
  }

  return config as HonoDocsConfig;
}
