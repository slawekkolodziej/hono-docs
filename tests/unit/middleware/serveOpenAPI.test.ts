import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import { Hono } from "hono";
import { serveOpenAPI } from "../../../src/middleware/serveOpenAPI";

// Mock dependencies
vi.mock("node:fs");
vi.mock("../../../src/config/loadConfig");
vi.mock("../../../src/core/runGenerate");

const mockedFs = vi.mocked(fs);
const mockedLoadConfig = vi.mocked((await import("../../../src/config/loadConfig")).loadConfig);
const mockedRunGenerate = vi.mocked((await import("../../../src/core/runGenerate")).runGenerate);

describe("serveOpenAPI middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for process.cwd()
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project');
    
    // Default mock for loadConfig - valid config
    mockedLoadConfig.mockResolvedValue({
      name: "test-api",
      appTypePath: "./app.ts",
      outputs: {
        openApiJson: "./openapi.json"
      },
      openApi: {
        openapi: "3.0.0",
        info: {
          title: "Test API",
          version: "1.0.0"
        }
      },
      tsConfigPath: "./tsconfig.json",
      excludePaths: []
    });
    
    // Default mock for runGenerate - successful generation
    mockedRunGenerate.mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("serves existing OpenAPI JSON file from default path", async () => {
    const openApiContent = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {}
    };
    
    mockedFs.existsSync.mockReturnValue(true); // ./openapi.json exists
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(openApiContent));
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    
    const responseBody = await response.json();
    expect(responseBody).toEqual(openApiContent);
    
    // Should not call runGenerate since file exists
    expect(mockedRunGenerate).not.toHaveBeenCalled();
    // Should check the default path
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/test/project/openapi.json');
  });

  test("serves existing OpenAPI JSON file from custom outputPath", async () => {
    const openApiContent = {
      openapi: "3.0.0",
      info: { title: "Custom API", version: "1.0.0" },
      paths: {}
    };
    
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(openApiContent));
    
    const app = new Hono().get('/api-spec.json', serveOpenAPI({ outputPath: './custom-spec.json' }));
    
    const response = await app.request('/api-spec.json');
    
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toEqual(openApiContent);
    
    // Should check the custom path
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/test/project/custom-spec.json');
    expect(mockedFs.readFileSync).toHaveBeenCalledWith('/test/project/custom-spec.json', 'utf-8');
  });

  test("auto-detects config when default openapi.json doesn't exist", async () => {
    const openApiContent = { openapi: "3.0.0", info: { title: "Test", version: "1.0.0" } };
    
    mockedFs.existsSync
      .mockReturnValueOnce(false) // ./openapi.json doesn't exist
      .mockReturnValueOnce(true)  // hono-docs.config.ts exists
      .mockReturnValueOnce(true); // config-specified openapi.json exists
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(openApiContent));
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(200);
    expect(mockedLoadConfig).toHaveBeenCalledWith('/test/project/hono-docs.config.ts');
  });

  test("auto-detects and uses hono-docs.config.js", async () => {
    const openApiContent = { openapi: "3.0.0", info: { title: "Test", version: "1.0.0" } };
    
    mockedFs.existsSync
      .mockReturnValueOnce(false) // hono-docs.config.ts doesn't exist
      .mockReturnValueOnce(true)  // hono-docs.config.js exists
      .mockReturnValueOnce(true); // openapi.json exists
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(openApiContent));
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(200);
    expect(mockedLoadConfig).toHaveBeenCalledWith('/test/project/hono-docs.config.js');
  });

  test("auto-detects and uses hono-docs.config.mjs", async () => {
    const openApiContent = { openapi: "3.0.0", info: { title: "Test", version: "1.0.0" } };
    
    mockedFs.existsSync
      .mockReturnValueOnce(false) // hono-docs.config.ts doesn't exist
      .mockReturnValueOnce(false) // hono-docs.config.js doesn't exist
      .mockReturnValueOnce(true)  // hono-docs.config.mjs exists
      .mockReturnValueOnce(true); // openapi.json exists
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(openApiContent));
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(200);
    expect(mockedLoadConfig).toHaveBeenCalledWith('/test/project/hono-docs.config.mjs');
  });

  test("uses custom config path when provided", async () => {
    const openApiContent = { openapi: "3.0.0", info: { title: "Test", version: "1.0.0" } };
    
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(openApiContent));
    
    const app = new Hono().get('/openapi.json', serveOpenAPI({ config: './custom-config.ts' }));
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(200);
    expect(mockedLoadConfig).toHaveBeenCalledWith('./custom-config.ts');
  });

  test("returns error when no config file found", async () => {
    mockedFs.existsSync.mockReturnValue(false); // No config files exist
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody.error).toContain("No hono-docs config file found");
    expect(responseBody.error).toContain("hono-docs.config.ts");
  });

  test("generates OpenAPI spec when file is missing (default behavior)", async () => {
    const openApiContent = { openapi: "3.0.0", info: { title: "Generated", version: "1.0.0" } };
    
    mockedFs.existsSync
      .mockReturnValueOnce(true)  // config file exists
      .mockReturnValueOnce(false) // openapi.json doesn't exist initially
      .mockReturnValueOnce(true); // openapi.json exists after generation
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(openApiContent));
    
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(200);
    expect(mockedRunGenerate).toHaveBeenCalledWith('/test/project/hono-docs.config.ts');
    expect(consoleSpy).toHaveBeenCalledWith("🔄 OpenAPI spec not found, generating...");
    
    const responseBody = await response.json();
    expect(responseBody).toEqual(openApiContent);
  });

  test("returns 404 when file missing and regenerate disabled", async () => {
    mockedFs.existsSync
      .mockReturnValueOnce(true)  // config file exists
      .mockReturnValueOnce(false); // openapi.json doesn't exist
    
    const app = new Hono().get('/openapi.json', serveOpenAPI({ regenerate: false }));
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(404);
    const responseBody = await response.json();
    expect(responseBody.error).toContain("OpenAPI spec not found");
    expect(responseBody.error).toContain("Set regenerate: true");
    
    // Should not try to generate
    expect(mockedRunGenerate).not.toHaveBeenCalled();
  });

  test("returns error when generation fails", async () => {
    mockedFs.existsSync
      .mockReturnValueOnce(true)  // config file exists
      .mockReturnValueOnce(false) // openapi.json doesn't exist initially
      .mockReturnValueOnce(false); // openapi.json still doesn't exist after "generation"
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody.error).toContain("Failed to generate OpenAPI spec");
  });

  test("handles loadConfig errors gracefully", async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedLoadConfig.mockRejectedValue(new Error("Invalid config"));
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody.error).toBe("Failed to serve OpenAPI spec");
    expect(responseBody.details).toBe("Invalid config");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error serving OpenAPI spec:", expect.any(Error));
  });

  test("handles runGenerate errors gracefully", async () => {
    mockedFs.existsSync
      .mockReturnValueOnce(true)  // config file exists
      .mockReturnValueOnce(false); // openapi.json doesn't exist
    
    mockedRunGenerate.mockRejectedValue(new Error("Generation failed"));
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody.error).toBe("Failed to serve OpenAPI spec");
    expect(responseBody.details).toBe("Generation failed");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error serving OpenAPI spec:", expect.any(Error));
  });

  test("handles JSON parsing errors gracefully", async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue("invalid json content");
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody.error).toBe("Failed to serve OpenAPI spec");
    expect(responseBody.details).toContain("Unexpected token");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error serving OpenAPI spec:", expect.any(SyntaxError));
  });

  test("works with complex OpenAPI specifications", async () => {
    const complexOpenApiContent = {
      openapi: "3.0.0",
      info: {
        title: "Complex API",
        version: "2.1.0",
        description: "A complex API with multiple paths"
      },
      servers: [
        { url: "https://api.example.com" }
      ],
      paths: {
        "/users": {
          get: {
            summary: "List users",
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" }
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: "Create user",
            requestBody: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CreateUser" }
                }
              }
            },
            responses: {
              "201": { description: "Created" },
              "400": { description: "Bad Request" }
            }
          }
        }
      },
      components: {
        schemas: {
          User: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" }
            }
          },
          CreateUser: {
            type: "object",
            required: ["name", "email"],
            properties: {
              name: { type: "string" },
              email: { type: "string" }
            }
          }
        }
      }
    };
    
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(complexOpenApiContent, null, 2));
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toEqual(complexOpenApiContent);
    expect(responseBody.info.title).toBe("Complex API");
    expect(responseBody.paths["/users"].get.summary).toBe("List users");
    expect(responseBody.components.schemas.User.properties.id.type).toBe("string");
  });

  test("respects different output paths from config", async () => {
    const customOutputPath = "./dist/api-spec.json";
    mockedLoadConfig.mockResolvedValue({
      name: "test-api",
      appTypePath: "./app.ts",
      outputs: {
        openApiJson: customOutputPath
      },
      openApi: {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" }
      },
      tsConfigPath: "./tsconfig.json",
      excludePaths: []
    });
    
    const openApiContent = { openapi: "3.0.0", info: { title: "Custom Path", version: "1.0.0" } };
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(openApiContent));
    
    const app = new Hono().get('/openapi.json', serveOpenAPI());
    
    const response = await app.request('/openapi.json');
    
    expect(response.status).toBe(200);
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/test/project/dist/api-spec.json');
    expect(mockedFs.readFileSync).toHaveBeenCalledWith('/test/project/dist/api-spec.json', 'utf-8');
  });

  test("can be used multiple times in same app with different configs", async () => {
    const defaultContent = { info: { title: "Default API" } };
    const customContent = { info: { title: "Custom API" } };
    
    mockedLoadConfig
      .mockResolvedValueOnce({
        name: "default-api",
        appTypePath: "./app.ts",
        outputs: { openApiJson: "./openapi.json" },
        openApi: { openapi: "3.0.0", info: { title: "Default", version: "1.0.0" } },
        tsConfigPath: "./tsconfig.json",
        excludePaths: []
      })
      .mockResolvedValueOnce({
        name: "custom-api",
        appTypePath: "./custom-app.ts",
        outputs: { openApiJson: "./custom-openapi.json" },
        openApi: { openapi: "3.0.0", info: { title: "Custom", version: "2.0.0" } },
        tsConfigPath: "./tsconfig.json",
        excludePaths: []
      });
    
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync
      .mockReturnValueOnce(JSON.stringify(defaultContent))
      .mockReturnValueOnce(JSON.stringify(customContent));
    
    const app = new Hono()
      .get('/openapi.json', serveOpenAPI()) // Default config
      .get('/custom-openapi.json', serveOpenAPI({ config: './custom-config.ts' })); // Custom config
    
    // Test default endpoint
    const defaultResponse = await app.request('/openapi.json');
    expect(defaultResponse.status).toBe(200);
    const defaultBody = await defaultResponse.json();
    expect(defaultBody.info.title).toBe("Default API");
    
    // Test custom endpoint
    const customResponse = await app.request('/custom-openapi.json');
    expect(customResponse.status).toBe(200);
    const customBody = await customResponse.json();
    expect(customBody.info.title).toBe("Custom API");
  });
});