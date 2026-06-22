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

describe("grouped-nested", () => {
  let spec: OpenApiSpec;

  beforeAll(async () => {
    spec = await generateFixtureSpec("grouped-nested");
  });

  test("generates the configured OpenAPI document", () => {
    expectOpenApiDocument(spec, "Nested Grouped App Test API", "Nested Grouped App");
  });

  test("flattens nested route() composition into final OpenAPI paths", () => {
    expectPaths(spec, {
      "/api/docs": ["get"],
      "/api/docs/{id}": ["get"],
      "/api/users": ["get", "post"],
      "/api/users/{id}": ["get"],
    });
  });

  test("adds path parameters owned by nested routers", () => {
    expectPathParameter(expectOperation(spec, "/api/docs/{id}", "get"), "id");
    expectPathParameter(expectOperation(spec, "/api/users/{id}", "get"), "id");
  });

  test("captures nested route response branches and request bodies", () => {
    expectStatusCodes(expectOperation(spec, "/api/docs/{id}", "get"), ["200"]);
    expectStatusCodes(expectOperation(spec, "/api/users/{id}", "get"), ["200"]);
    expectStatusCodes(expectOperation(spec, "/api/users", "post"), ["200"]);
    expect(expectOperation(spec, "/api/users", "post").requestBody).toBeUndefined();
  });

  test("uses the API group tag on every operation", () => {
    for (const operations of Object.values(spec.paths)) {
      for (const operation of Object.values(operations)) {
        expect(operation?.tags).toEqual(["Nested Grouped App"]);
      }
    }
  });

  test("matches snapshot", () => {
    expect(spec).toMatchSnapshot();
  });
});
