import { describe, test, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Test files are located in integration-tests directory
const rootDir = path.resolve(import.meta.dirname, "..");
const integrationTestsDir = path.join(rootDir, "integration-tests");
const cliPath = path.join(rootDir, "dist/cli/index.js");

describe("manual-routes - Manual API definitions with overrides", () => {
  const configPath = "./manual-routes/hono-docs.ts";
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

  test("generates empty OpenAPI due to BlankSchema limitation", () => {
    // CURRENT STATUS: Simple Hono apps generate BlankSchema instead of typed routes
    // 
    // We now handle this gracefully by detecting BlankSchema and falling back,
    // but the source parsing implementation is not yet complete.
    //
    // The generated OpenAPI will be valid but empty (no paths).
    // 
    // WORKAROUND: Users can wrap simple routes with .route():
    //   const app = new Hono().route("/", simpleRoutes);
    
    // This should no longer throw - it should generate empty OpenAPI
    execSync(`node ${cliPath} generate --config ${configPathFull}`, {
      stdio: "pipe", 
      cwd: testCaseDir,
    });

    expect(fs.existsSync(outputPath)).toBe(true);
    
    const output = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    expect(output).toHaveProperty("openapi");
    expect(output).toHaveProperty("info");
    expect(output).toHaveProperty("paths");
    
    // Currently generates empty paths due to unimplemented source parsing
    expect(Object.keys(output.paths)).toHaveLength(0);
  });
});