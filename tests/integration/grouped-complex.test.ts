import { beforeAll, describe, expect, test } from "vitest";
import {
  expectOpenApiDocument,
  expectOperation,
  expectPathParameter,
  expectPaths,
  expectStatusCodes,
  generateFixtureSpec,
  OpenApiSpec,
} from "./support/openapi";

describe("grouped-complex", () => {
  let spec: OpenApiSpec;

  beforeAll(async () => {
    spec = await generateFixtureSpec("grouped-complex");
  });

  test("generates the configured OpenAPI document", () => {
    expectOpenApiDocument(spec, "Complex Grouped App Test API", "Complex Grouped App");
  });

  test("preserves unrelated route groups mounted at different prefixes", () => {
    expectPaths(spec, {
      "/health": ["get"],
      "/api/v1/docs": ["get"],
      "/api/v1/docs/{id}": ["get"],
      "/api/v1/users": ["get", "post"],
      "/api/v1/users/{id}": ["get"],
      "/auth/login": ["post"],
      "/auth/logout": ["post"],
    });
  });

  test("adds path parameters inside deeply mounted API routes", () => {
    expectPathParameter(expectOperation(spec, "/api/v1/docs/{id}", "get"), "id");
    expectPathParameter(expectOperation(spec, "/api/v1/users/{id}", "get"), "id");
  });

  test("captures response branches across API and auth groups", () => {
    expectStatusCodes(expectOperation(spec, "/health", "get"), ["200"]);
    expectStatusCodes(expectOperation(spec, "/api/v1/users/{id}", "get"), ["200"]);
    expectStatusCodes(expectOperation(spec, "/api/v1/users", "post"), ["200"]);
    expectStatusCodes(expectOperation(spec, "/auth/login", "post"), ["200"]);
    expectStatusCodes(expectOperation(spec, "/auth/logout", "post"), ["200"]);
  });

  test("uses the API group tag on every operation", () => {
    for (const operations of Object.values(spec.paths)) {
      for (const operation of Object.values(operations)) {
        expect(operation?.tags).toEqual(["Complex Grouped App"]);
      }
    }
  });

  test("matches snapshot", () => {
    expect(spec).toMatchSnapshot();
  });
});
