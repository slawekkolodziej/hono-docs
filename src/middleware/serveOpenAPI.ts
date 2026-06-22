import fs from 'node:fs'
import path from 'node:path'
import type { Env, Handler, Input, TypedResponse } from 'hono'
import type { BlankInput } from 'hono/types'
import { loadConfig } from '../config/loadConfig'
import { runGenerate, runGenerateFromConfig } from '../core/runGenerate'
import type { HonoDocsConfig } from '../types'

export interface ServeOpenAPIConfig {
  /**
   * Path to the hono-docs config file, or an imported hono-docs config object.
   * If not provided, will auto-detect from common locations.
   */
  config?: string | HonoDocsConfig

  /**
   * Project root used to resolve output paths when config is an imported object.
   * Defaults to process.cwd().
   */
  rootPath?: string

  /**
   * Path to the OpenAPI JSON file to serve.
   * If not provided, will be determined from the config file.
   */
  outputPath?: string

  /**
   * Whether to regenerate the OpenAPI spec if the file is missing.
   * Defaults to true.
   */
  regenerate?: boolean
}

/**
 * Auto-detect hono-docs config file from common locations.
 * Prioritizes JS/MJS over TS for better runtime compatibility.
 */
function findConfigFile(): string | undefined {
  const rootPath = process.cwd()
  const possibleConfigs = [
    'hono-docs.config.js', // Try JS first (best runtime compatibility)
    'hono-docs.config.mjs', // Then MJS (ES modules)
    'hono-docs.config.ts', // TS as last resort (requires transpiler)
  ]

  for (const config of possibleConfigs) {
    const configPath = path.join(rootPath, config)
    if (fs.existsSync(configPath)) {
      return configPath
    }
  }

  return undefined
}

function isConfigObject(config: ServeOpenAPIConfig['config']): config is HonoDocsConfig {
  return Boolean(config) && typeof config === 'object'
}

/**
 * Middleware to serve OpenAPI JSON spec.
 * Automatically generates the spec if it doesn't exist.
 *
 * @example
 * ```typescript
 * const app = new Hono()
 *   .get('/openapi.json', serveOpenAPI())
 * ```
 */
type ServeOpenAPIResponse = TypedResponse<unknown, 200 | 404 | 500, 'json'>

export const serveOpenAPI = <
  E extends Env = Env,
  P extends string = string,
  I extends Input = BlankInput,
>(
  options: ServeOpenAPIConfig = {}
): Handler<E, P, I, ServeOpenAPIResponse> => {
  return async (c) => {
    const {
      config: configInput,
      outputPath: customOutputPath,
      regenerate = true,
      rootPath = process.cwd(),
    } = options

    try {
      let outputPath: string
      let resolvedConfigPath: string | undefined
      let config: HonoDocsConfig | undefined
      const importedConfig = isConfigObject(configInput) ? configInput : undefined
      const configPath = typeof configInput === 'string' ? configInput : undefined

      // If output path is provided directly, use it
      if (customOutputPath) {
        outputPath = path.resolve(rootPath, customOutputPath)
      } else if (importedConfig) {
        config = importedConfig
        outputPath = path.resolve(rootPath, config.outputs.openApiJson)
      } else {
        // Try ./openapi.json first before loading config
        const defaultPath = path.join(process.cwd(), 'openapi.json')

        if (fs.existsSync(defaultPath)) {
          outputPath = defaultPath
        } else {
          // Need to load config to determine output path
          resolvedConfigPath = configPath || findConfigFile()

          if (!resolvedConfigPath) {
            return c.json(
              {
                error:
                  'No hono-docs config file found. Expected hono-docs.config.js, hono-docs.config.mjs, or hono-docs.config.ts',
              },
              500
            )
          }

          // Load config to get output path
          config = await loadConfig(resolvedConfigPath)

          outputPath = path.resolve(process.cwd(), config.outputs.openApiJson)
        }
      }

      // Check if OpenAPI file exists
      if (!fs.existsSync(outputPath)) {
        if (!regenerate) {
          return c.json(
            {
              error: `OpenAPI spec not found at ${outputPath}. Set regenerate: true to auto-generate.`,
            },
            404
          )
        }

        // Need config file for generation
        if (!resolvedConfigPath && !importedConfig) {
          resolvedConfigPath = configPath || findConfigFile()

          if (!resolvedConfigPath) {
            return c.json(
              {
                error: 'No hono-docs config file found. Cannot generate OpenAPI spec.',
              },
              500
            )
          }
        }

        console.log('🔄 OpenAPI spec not found, generating...')

        // Generate the OpenAPI spec
        if (importedConfig) {
          await runGenerateFromConfig(importedConfig, rootPath)
        } else {
          await runGenerate(resolvedConfigPath)
        }

        // Verify the file was created
        if (!fs.existsSync(outputPath)) {
          return c.json(
            {
              error: `Failed to generate OpenAPI spec at ${outputPath}`,
            },
            500
          )
        }
      }

      // Read and serve the OpenAPI JSON
      const openApiContent = fs.readFileSync(outputPath, 'utf-8')
      const openApiJson = JSON.parse(openApiContent)

      // Set appropriate headers
      c.header('Content-Type', 'application/json')
      c.header('Cache-Control', 'no-cache')

      return c.json(openApiJson)
    } catch (error) {
      console.error('Error serving OpenAPI spec:', error)
      return c.json(
        {
          error: 'Failed to serve OpenAPI spec',
          details: error instanceof Error ? error.message : String(error),
        },
        500
      )
    }
  }
}
