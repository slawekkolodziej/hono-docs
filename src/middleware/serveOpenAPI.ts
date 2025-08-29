import fs from "node:fs";
import path from "node:path";
import { createMiddleware } from 'hono/factory';
import { loadConfig } from "../config/loadConfig";
import { runGenerate } from "../core/runGenerate";

export interface ServeOpenAPIConfig {
  /**
   * Path to the hono-docs config file. 
   * If not provided, will auto-detect from common locations.
   */
  config?: string;
  
  /**
   * Path to the OpenAPI JSON file to serve.
   * If not provided, will be determined from the config file.
   */
  outputPath?: string;
  
  /**
   * Whether to regenerate the OpenAPI spec if the file is missing.
   * Defaults to true.
   */
  regenerate?: boolean;
}

/**
 * Auto-detect hono-docs config file from common locations
 */
function findConfigFile(): string | undefined {
  const rootPath = process.cwd();
  const possibleConfigs = [
    'hono-docs.config.ts',
    'hono-docs.config.js',
    'hono-docs.config.mjs'
  ];
  
  for (const config of possibleConfigs) {
    const configPath = path.join(rootPath, config);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  
  return undefined;
}

/**
 * Middleware to serve OpenAPI JSON spec.
 * Automatically generates the spec if it doesn't exist.
 * 
 * @example
 * ```typescript
 * const app = new Hono()
 *   .get('/openapi.json', serveOpenAPI())
 *   .get('/openapi.json', serveOpenAPI({ config: './custom-config.ts' }))
 * ```
 */
export const serveOpenAPI = (options: ServeOpenAPIConfig = {}) => {
  return createMiddleware(async (c) => {
    const { config: configPath, outputPath: customOutputPath, regenerate = true } = options;
    
    try {
      let outputPath: string;
      let resolvedConfigPath: string | undefined;
      
      // If output path is provided directly, use it
      if (customOutputPath) {
        outputPath = path.resolve(process.cwd(), customOutputPath);
      } else {
        // Try ./openapi.json first before loading config
        const defaultPath = path.join(process.cwd(), 'openapi.json');
        
        if (fs.existsSync(defaultPath)) {
          outputPath = defaultPath;
        } else {
          // Need to load config to determine output path
          resolvedConfigPath = configPath || findConfigFile();
          
          if (!resolvedConfigPath) {
            return c.json({ 
              error: "No hono-docs config file found. Expected hono-docs.config.ts, hono-docs.config.js, or hono-docs.config.mjs" 
            }, 500);
          }
          
          // Load config to get output path
          const config = await loadConfig(resolvedConfigPath);
          outputPath = path.join(process.cwd(), config.outputs.openApiJson);
        }
      }
      
      // Check if OpenAPI file exists
      if (!fs.existsSync(outputPath)) {
        if (!regenerate) {
          return c.json({ 
            error: `OpenAPI spec not found at ${outputPath}. Set regenerate: true to auto-generate.` 
          }, 404);
        }
        
        // Need config file for generation
        if (!resolvedConfigPath) {
          resolvedConfigPath = configPath || findConfigFile();
          
          if (!resolvedConfigPath) {
            return c.json({ 
              error: "No hono-docs config file found. Cannot generate OpenAPI spec." 
            }, 500);
          }
        }
        
        console.log("🔄 OpenAPI spec not found, generating...");
        
        // Generate the OpenAPI spec
        await runGenerate(resolvedConfigPath);
        
        // Verify the file was created
        if (!fs.existsSync(outputPath)) {
          return c.json({ 
            error: `Failed to generate OpenAPI spec at ${outputPath}` 
          }, 500);
        }
      }
      
      // Read and serve the OpenAPI JSON
      const openApiContent = fs.readFileSync(outputPath, "utf-8");
      const openApiJson = JSON.parse(openApiContent);
      
      // Set appropriate headers
      c.header("Content-Type", "application/json");
      c.header("Cache-Control", "no-cache");
      
      return c.json(openApiJson);
      
    } catch (error) {
      console.error("Error serving OpenAPI spec:", error);
      return c.json({ 
        error: "Failed to serve OpenAPI spec", 
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });
};