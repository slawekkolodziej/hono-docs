// src/cli/loadConfig.ts
import { resolve } from "path";
import { existsSync } from "fs";
import type { HonoDocsConfig } from "../types";
import { unwrapModule } from "../utils/libDir";

export async function loadConfig(configFile: string): Promise<HonoDocsConfig> {
  // 1. Resolve absolute path
  const fullPath = resolve(process.cwd(), configFile);
  if (!existsSync(fullPath)) {
    throw new Error(`[hono-docs] Config file not found: ${fullPath}`);
  }

  let configModule: unknown;
  try {
    configModule = await import(fullPath);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    throw new Error(
      `[hono-docs] Failed to load config: ${err.message ?? String(err)}`
    );
  }

  const config = unwrapModule(configModule);

  if (!config || typeof config !== "object") {
    throw new Error(
      `[hono-docs] Invalid config file. Expected an object, got: ${typeof config}`
    );
  }

  // console.log({ config });
  return config as HonoDocsConfig;
}
