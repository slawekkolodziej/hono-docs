import { describe, test, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import { runGenerate } from "../../src/core/runGenerate";

// Test files are located in integration-tests directory
const rootDir = path.resolve(import.meta.dirname, "../..");
const integrationTestsDir = path.join(rootDir, "integration-tests");

describe.each([
  {
    name: "grouped-simple",
    configPath: "./grouped-simple/hono-docs.config.ts",
    description: "Simple grouped app with .route()",
    expectedRoutes: {
      "/docs": ["get"],
      "/docs/{id}": ["get"],
      "/users": ["get", "post"],
      "/users/{id}": ["get"],
    },
  },
  {
    name: "grouped-basepath",
    configPath: "./grouped-basepath/hono-docs.config.ts",
    description: "Grouped app with basePath",
    expectedRoutes: {
      "/v1/docs": ["get"],
      "/v1/docs/{id}": ["get"],
      "/v1/users": ["get", "post"],
      "/v1/users/{id}": ["get"],
    },
  },
  {
    name: "grouped-complex",
    configPath: "./grouped-complex/hono-docs.config.ts",
    description: "Complex grouped app with mixed composition",
    expectedRoutes: {
      "/health": ["get"],
      "/api/v1/docs": ["get"],
      "/api/v1/docs/{id}": ["get"],
      "/api/v1/users": ["get", "post"],
      "/api/v1/users/{id}": ["get"],
      "/auth/login": ["post"],
      "/auth/logout": ["post"],
    },
  },
  {
    name: "grouped-nested",
    configPath: "./grouped-nested/hono-docs.config.ts",
    description: "Nested grouping",
    expectedRoutes: {
      "/api/docs": ["get"],
      "/api/docs/{id}": ["get"],
      "/api/users": ["get", "post"],
      "/api/users/{id}": ["get"],
    },
  },
])("$name - $description", ({ configPath, expectedRoutes }) => {
  // Run the generation using the local CLI
  const configPathFull = path.join(integrationTestsDir, configPath);
  const testCaseDir = path.dirname(configPathFull);
  const outputPath = path.resolve(testCaseDir, "openapi.json");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let output: any = null;

  beforeAll(async () => {
    // Change to the test case directory to match CLI behavior
    const originalCwd = process.cwd();
    process.chdir(testCaseDir);
    
    try {
      await runGenerate(configPathFull);
      output = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    } finally {
      // Always restore original working directory
      process.chdir(originalCwd);
    }
  });

  test("generate OpenAPI spec", () => {
    // Check that output file exists
    expect(fs.existsSync(outputPath)).toBe(true);

    // Basic structure checks
    expect(output).toHaveProperty("openapi");
    expect(output).toHaveProperty("info");
    expect(output).toHaveProperty("paths");

    // Check that all expected routes are present with correct methods
    const paths = output.paths || {};

    expect(paths).toEqual(
      expect.objectContaining(
        Object.fromEntries(
          Object.entries(expectedRoutes).map(([route, methods]) => [
            route,
            expect.objectContaining(
              Object.fromEntries(
                methods.map((method: string) => [
                  method.toLowerCase(),
                  expect.any(Object),
                ])
              )
            ),
          ])
        )
      )
    );

    // Ensure we have the expected number of routes
    expect(Object.keys(paths)).toHaveLength(Object.keys(expectedRoutes).length);
  });

  test("matches snapshot", () => {
    // Use Vitest's snapshot testing
    expect(output).toMatchSnapshot();
  });
});
