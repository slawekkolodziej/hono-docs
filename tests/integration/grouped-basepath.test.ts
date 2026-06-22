import { beforeAll, describe, expect, test } from "vitest";
import {
  expectOpenApiDocument,
  expectOperation,
  expectPathParameter,
  expectPaths,
  generateFixtureSpec,
  OpenApiSpec,
} from "./support/openapi";

describe("grouped-basepath", () => {
  let spec: OpenApiSpec;

  beforeAll(async () => {
    spec = await generateFixtureSpec("grouped-basepath");
  });

  test("generates the configured OpenAPI document", () => {
    expectOpenApiDocument(spec, "BasePath Grouped App Test API", "BasePath Grouped App");
  });

  test("preserves the basePath prefix on every grouped route", () => {
    expectPaths(spec, {
      "/v1/docs": ["get"],
      "/v1/docs/{id}": ["get"],
      "/v1/users": ["get", "post"],
      "/v1/users/{id}": ["get"],
    });
  });

  test("adds path parameters after the basePath prefix", () => {
    expectPathParameter(expectOperation(spec, "/v1/docs/{id}", "get"), "id");
    expectPathParameter(expectOperation(spec, "/v1/users/{id}", "get"), "id");
  });

  test("uses the API group tag on every operation", () => {
    for (const operations of Object.values(spec.paths)) {
      for (const operation of Object.values(operations)) {
        expect(operation?.tags).toEqual(["BasePath Grouped App"]);
      }
    }
  });

  test("matches snapshot", () => {
    expect(spec).toMatchSnapshot();
  });
});
