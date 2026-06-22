import fs from "node:fs";
import path from "node:path";
import { expect } from "vitest";
import { runGenerate } from "../../../src/core/runGenerate";

export type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

export type OpenApiOperation = {
  tags?: string[];
  summary?: string;
  description?: string;
  deprecated?: boolean;
  parameters?: unknown[];
  requestBody?: unknown;
  responses: Record<string, unknown>;
};

export type OpenApiSpec = {
  openapi: string;
  info: Record<string, unknown>;
  tags?: { name: string }[];
  paths: Record<string, Partial<Record<HttpMethod, OpenApiOperation>>>;
};

const rootDir = path.resolve(import.meta.dirname, "../../..");
const integrationDir = path.join(rootDir, "integration");

export async function generateFixtureSpec(
  fixtureName: string,
  configFile = "hono-docs.config.ts"
): Promise<OpenApiSpec> {
  const fixtureDir = path.join(integrationDir, fixtureName);
  const configPath = path.join(fixtureDir, configFile);
  const outputPath = path.join(fixtureDir, "openapi.json");

  await runGenerate(configPath);
  return JSON.parse(fs.readFileSync(outputPath, "utf-8")) as OpenApiSpec;
}

export function expectOpenApiDocument(
  spec: OpenApiSpec,
  title: string,
  tagName: string
): void {
  expect(spec.openapi).toBe("3.0.0");
  expect(spec.info).toMatchObject({ title });
  expect(spec.tags).toContainEqual({ name: tagName });
  expect(spec.paths).toBeTypeOf("object");
}

export function expectPaths(
  spec: OpenApiSpec,
  expectedPaths: Record<string, HttpMethod[]>
): void {
  expect(Object.keys(spec.paths).sort()).toEqual(Object.keys(expectedPaths).sort());

  for (const [pathName, methods] of Object.entries(expectedPaths)) {
    expect(Object.keys(spec.paths[pathName] ?? {}).sort()).toEqual([...methods].sort());
  }
}

export function expectNoPaths(spec: OpenApiSpec, pathNames: string[]): void {
  for (const pathName of pathNames) {
    expect(spec.paths).not.toHaveProperty(pathName);
  }
}

export function expectOperation(
  spec: OpenApiSpec,
  pathName: string,
  method: HttpMethod
): OpenApiOperation {
  const operation = spec.paths[pathName]?.[method];
  expect(operation).toBeDefined();
  return operation as OpenApiOperation;
}

export function expectPathParameter(
  operation: OpenApiOperation,
  parameterName: string
): void {
  expect(operation.parameters).toContainEqual({
    name: parameterName,
    in: "path",
    required: true,
    schema: { type: "string" },
  });
}

export function expectStatusCodes(
  operation: OpenApiOperation,
  statusCodes: string[]
): void {
  expect(Object.keys(operation.responses)).toEqual(statusCodes);
}

export function expectJsonRequestBody(
  operation: OpenApiOperation,
  requiredFields: string[]
): void {
  expect(operation.requestBody).toMatchObject({
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: requiredFields,
        },
      },
    },
  });
}
