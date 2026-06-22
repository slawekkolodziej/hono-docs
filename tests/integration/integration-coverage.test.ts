import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const rootDir = path.resolve(import.meta.dirname, "../..");
const integrationDir = path.join(rootDir, "integration");
const integrationTestDir = path.join(rootDir, "tests/integration");

function integrationNames(): string[] {
  return fs
    .readdirSync(integrationDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

describe("integration test coverage", () => {
  test.each(integrationNames())("%s has a dedicated integration test file", (name: string) => {
    expect(fs.existsSync(path.join(integrationTestDir, `${name}.test.ts`))).toBe(true);
  });
});
