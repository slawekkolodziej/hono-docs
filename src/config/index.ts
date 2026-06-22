// src/config/index.ts
import type { HonoDocsConfig } from '../types'

/**
 * Defines a typed hono-docs configuration object.
 *
 * This helper returns the config unchanged, but gives TypeScript and editors enough context to
 * validate fields such as `appTypePath`, `outputs.openApiJson`, `openApi`, and route overrides.
 *
 * @param config - hono-docs configuration for one Hono application.
 * @returns The same config object with `HonoDocsConfig` typing.
 */
export function defineConfig(config: HonoDocsConfig): HonoDocsConfig {
  return config
}
