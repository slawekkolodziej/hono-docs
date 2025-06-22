// src/config/loadConfig.ts
import { resolve, extname } from "path";
import { existsSync } from "fs";
import { register } from "esbuild-register/dist/node";
import { pathToFileURL } from "url";
import { createRequire } from "module";
import type { HonoDocsConfig } from "../types";

const nodeRequire = createRequire(import.meta.url);

export async function loadConfig(configFile: string): Promise<HonoDocsConfig> {
  const fullPath = resolve(process.cwd(), configFile);
  if (!existsSync(fullPath)) {
    throw new Error(`Config file not found: ${fullPath}`);
  }

  const ext = extname(fullPath).toLowerCase();
  let unregister: () => void = () => {};

  // Hook TS → JS for require()
  if (ext === ".ts" || ext === ".tsx" || ext === ".mts") {
    ({ unregister } = register());
  }

  try {
    let loaded: unknown;
    if (ext === ".js" || ext === ".cjs") {
      // pure JS: use ESM import for .mjs or require for .cjs
      loaded = await import(pathToFileURL(fullPath).href);
    } else if (ext === ".mjs") {
      loaded = await import(pathToFileURL(fullPath).href);
    } else {
      // TS, or any other: use require so esbuild-register can transpile it
      loaded = nodeRequire(fullPath);
    }

    // Support both `export default` and module.exports
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = (loaded && (loaded as any).default) || loaded;
    console.log({ config });
    return config as HonoDocsConfig;
  } finally {
    // always cleanup the hook
    unregister();
  }
}
