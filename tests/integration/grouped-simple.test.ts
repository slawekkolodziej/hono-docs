import { beforeAll, describe, expect, test } from "vitest";
import {
  expectJsonRequestBody,
  expectNoPaths,
  expectOpenApiDocument,
  expectOperation,
  expectPathParameter,
  expectPaths,
  expectStatusCodes,
  generateFixtureSpec,
  OpenApiSpec,
} from "./support/openapi";

describe("grouped-simple", () => {
  let spec: OpenApiSpec;

  beforeAll(async () => {
    spec = await generateFixtureSpec("grouped-simple");
  });

  test("generates the configured OpenAPI document", () => {
    expectOpenApiDocument(spec, "Simple Grouped App Test API", "Simple Grouped App");
  });

  test("preserves route() composition from docs and users routers", () => {
    expectPaths(spec, {
      "/docs": ["get"],
      "/docs/{id}": ["get"],
      "/users": ["get", "post"],
      "/users/{id}": ["get"],
    });

    expectNoPaths(spec, ["/openapi.json", "/swagger"]);
  });

  test("adds path parameters to grouped dynamic routes", () => {
    expectPathParameter(expectOperation(spec, "/docs/{id}", "get"), "id");
    expectPathParameter(expectOperation(spec, "/users/{id}", "get"), "id");
  });

  test("captures status branches from grouped handlers", () => {
    expectStatusCodes(expectOperation(spec, "/docs", "get"), ["200"]);
    expectStatusCodes(expectOperation(spec, "/docs/{id}", "get"), ["200", "404"]);
    expectStatusCodes(expectOperation(spec, "/users/{id}", "get"), ["200", "404"]);
  });

  test("captures Zod request body and validation errors inside grouped routes", () => {
    const operation = expectOperation(spec, "/users", "post");

    expectJsonRequestBody(operation, ["name", "email"]);
    expectStatusCodes(operation, ["201", "400"]);
  });

  test("uses the API group tag on every operation", () => {
    for (const operations of Object.values(spec.paths)) {
      for (const operation of Object.values(operations)) {
        expect(operation?.tags).toEqual(["Simple Grouped App"]);
      }
    }
  });

  test("matches snapshot", () => {
    expect(spec).toMatchSnapshot();
  });
});
