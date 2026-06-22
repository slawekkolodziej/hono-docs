import { beforeAll, describe, expect, test } from "vitest";
import {
  expectOpenApiDocument,
  expectOperation,
  expectPathParameter,
  expectPaths,
  generateFixtureSpec,
  OpenApiSpec,
} from "./support/openapi";

describe("manual-routes", () => {
  let spec: OpenApiSpec;

  beforeAll(async () => {
    spec = await generateFixtureSpec("manual-routes", "hono-docs.ts");
  });

  test("generates the configured OpenAPI document", () => {
    expectOpenApiDocument(spec, "Manual Routes Test API", "User Routes");
    expect(spec.info.description).toBe("Manual route definition pattern test");
    expect(spec).toHaveProperty("servers", [{ url: "http://localhost:3000/api" }]);
  });

  test("keeps inferred route paths and methods", () => {
    expectPaths(spec, {
      "/user": ["get"],
      "/user/{id}": ["get"],
    });
  });

  test("applies manual tag overrides to matching operations", () => {
    expect(expectOperation(spec, "/user", "get").tags).toEqual(["UserList"]);
    expect(expectOperation(spec, "/user/{id}", "get").tags).toEqual(["UserDetail"]);
  });

  test("converts Hono path params to OpenAPI path parameters", () => {
    expectPathParameter(expectOperation(spec, "/user/{id}", "get"), "id");
  });

  test("matches snapshot", () => {
    expect(spec).toMatchSnapshot();
  });
});
