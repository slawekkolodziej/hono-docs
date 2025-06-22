import { resolve, extname } from "path";
import { existsSync } from "fs";
import { register } from "esbuild-register/dist/node";
import type { HonoDocsConfig } from "../types";

export async function loadConfig(configFile: string): Promise<HonoDocsConfig> {
  // 1) Resolve absolute path
  const fullPath = resolve(process.cwd(), configFile);
  if (!existsSync(fullPath)) {
    throw new Error(`Config file not found: ${fullPath}`);
  }

  // 2) Temporarily hook TS -> JS if needed
  const ext = extname(fullPath);
  let unregister: () => void = () => {};
  if (ext === ".ts" || ext === ".tsx") {
    ({ unregister } = register({
      // TODO
      // you can forward tsconfig if you like:
      // tsconfig: resolve(process.cwd(), 'tsconfig.json'),
    }));
  }

  // 3) Dynamic import / require
  let loaded: unknown;
  if (ext === ".mjs" || ext === ".mts") {
    loaded = await import(fullPath);
  } else {
    loaded = await import(fullPath);
  }
  unregister();

  // 4) Support both `export default` and module.exports
  const config =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loaded && (loaded as any).default ? (loaded as any).default : loaded;
  return config as HonoDocsConfig;
}
