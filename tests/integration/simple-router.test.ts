import { describe, test, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import { runGenerate } from "../../src/core/runGenerate";

// Test files are located in integration-tests directory
const rootDir = path.resolve(import.meta.dirname, "../..");
const integrationTestsDir = path.join(rootDir, "integration-tests");

describe("manual-routes - Manual API definitions with overrides", () => {
  const configPath = "./manual-routes/hono-docs.ts";
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

    // Check expected paths exist
    expect(output.paths).toHaveProperty("/user");
    expect(output.paths).toHaveProperty("/user/{id}");

    // Check manual tag overrides work
    expect(output.paths["/user"].get.tags).toEqual(["UserList"]);
    expect(output.paths["/user/{id}"].get.tags).toEqual(["User Routes"]);

    // Check parameter extraction
    expect(output.paths["/user/{id}"].get.parameters).toHaveLength(1);
    expect(output.paths["/user/{id}"].get.parameters[0].name).toBe("id");
    expect(output.paths["/user/{id}"].get.parameters[0].in).toBe("path");
  });

  test("manual configuration overrides auto-generation", () => {
    // UserList tag from manual config should override default
    expect(output.paths["/user"].get.tags).toEqual(["UserList"]);
    
    // Second route should get the apiGroup name as fallback
    expect(output.paths["/user/{id}"].get.tags).toEqual(["User Routes"]);
  });

  test("matches snapshot", () => {
    expect(output).toMatchSnapshot();
  });
});

describe("simple-router - Non-grouped basic Hono app", () => {
  const configPath = "./simple-router/hono-docs.config.ts";
  const configPathFull = path.join(integrationTestsDir, configPath);
  const testCaseDir = path.dirname(configPathFull);
  const outputPath = path.resolve(testCaseDir, "openapi.json");

  test("generates complete OpenAPI spec with simple router support", async () => {
    // FIXED: Simple Hono apps now work! 
    // 
    // When TypeScript generates BlankSchema for simple apps, we fall back to 
    // source code parsing to extract routes directly from the AST.
    //
    // This generates complete OpenAPI with all routes and HTTP methods.
    
    // Change to the test case directory to match CLI behavior
    const originalCwd = process.cwd();
    process.chdir(testCaseDir);
    
    try {
      await runGenerate(configPathFull);
    } finally {
      // Always restore original working directory
      process.chdir(originalCwd);
    }

    expect(fs.existsSync(outputPath)).toBe(true);
    
    const output = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    expect(output).toHaveProperty("openapi");
    expect(output).toHaveProperty("info");
    expect(output).toHaveProperty("paths");
    
    // Now generates complete paths from source parsing
    expect(Object.keys(output.paths)).toHaveLength(2); // /api/users and /api/users/{id}
    
    // Verify the generated routes match our simple router implementation
    expect(output.paths).toHaveProperty("/api/users");
    expect(output.paths).toHaveProperty("/api/users/{id}");
    
    // Verify HTTP methods are detected
    expect(output.paths["/api/users"]).toHaveProperty("get");
    expect(output.paths["/api/users"]).toHaveProperty("post"); 
    expect(output.paths["/api/users/{id}"]).toHaveProperty("get");
    expect(output.paths["/api/users/{id}"]).toHaveProperty("put");
    expect(output.paths["/api/users/{id}"]).toHaveProperty("delete");
    
    // Verify proper tagging from API group
    expect(output.paths["/api/users"].get.tags).toEqual(["Simple Router"]);
    expect(output.paths["/api/users/{id}"].get.tags).toEqual(["Simple Router"]);
  });

  test("validates complete OpenAPI structure for simple router", async () => {
    // This test validates the complete OpenAPI structure and content
    // for simple Hono apps that don't use .route() grouping
    
    // Change to the test case directory to match CLI behavior
    const originalCwd = process.cwd();
    process.chdir(testCaseDir);
    
    try {
      await runGenerate(configPathFull);
    } finally {
      // Always restore original working directory
      process.chdir(originalCwd);
    }

    const output = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

    // Basic structure validation
    expect(output).toHaveProperty("openapi", "3.0.0");
    expect(output).toHaveProperty("info");
    expect(output.info).toEqual({
      title: "Simple Router Test API",
      version: "1.0.0",
      description: "Simple non-grouped router pattern test"
    });

    // Tags should be generated from API group name
    expect(output).toHaveProperty("tags");
    expect(output.tags).toContainEqual({
      name: "Simple Router"
    });

    // All routes from routes.ts should be present
    expect(output.paths).toHaveProperty("/api/users");
    expect(output.paths).toHaveProperty("/api/users/{id}");

    // Validate GET /api/users route
    const getUsersRoute = output.paths["/api/users"].get;
    expect(getUsersRoute).toBeDefined();
    expect(getUsersRoute.tags).toEqual(["Simple Router"]);
    expect(getUsersRoute.responses).toHaveProperty("default");
    expect(getUsersRoute.responses["default"]).toHaveProperty("content");

    // Validate GET /api/users/{id} route
    const getUserByIdRoute = output.paths["/api/users/{id}"].get;
    expect(getUserByIdRoute).toBeDefined();
    expect(getUserByIdRoute.tags).toEqual(["Simple Router"]);
    // Note: Simple router fallback doesn't generate parameter schemas from source parsing

    // Validate POST /api/users route
    const postUsersRoute = output.paths["/api/users"].post;
    expect(postUsersRoute).toBeDefined();
    expect(postUsersRoute.tags).toEqual(["Simple Router"]);
    expect(postUsersRoute.responses).toHaveProperty("201");
    // Note: With proper method chaining, TypeScript can infer response types and status codes

    // Validate PUT /api/users/{id} route
    const putUserByIdRoute = output.paths["/api/users/{id}"].put;
    expect(putUserByIdRoute).toBeDefined();
    expect(putUserByIdRoute.tags).toEqual(["Simple Router"]);

    // Validate DELETE /api/users/{id} route
    const deleteUserByIdRoute = output.paths["/api/users/{id}"].delete;
    expect(deleteUserByIdRoute).toBeDefined();
    expect(deleteUserByIdRoute.tags).toEqual(["Simple Router"]);
  });

  test("matches complete simple router structure snapshot", () => {
    const output = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    expect(output).toMatchSnapshot();
  });
});