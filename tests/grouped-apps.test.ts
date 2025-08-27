import { describe, test, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Test files are located in integration-tests directory
const rootDir = path.resolve(import.meta.dirname, "..");
const integrationTestsDir = path.join(rootDir, "integration-tests");
const cliPath = path.join(rootDir, "dist/cli/index.js");

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
  let output: any = null;

  beforeAll(() => {
    execSync(`node ${cliPath} generate --config ${configPathFull}`, {
      stdio: "inherit",
      cwd: testCaseDir,
    });

    output = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
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
