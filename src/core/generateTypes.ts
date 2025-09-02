import fs from "node:fs";
import path from "node:path";
import createDebug from "debug";
import type { ApiGroup, GenerateParams } from "../types";
import { normalizeImportPaths } from "../utils/format";

const debug = createDebug("hono-docs");

export async function generateTypes({
  config,
  project,
  rootPath,
  apiGroup,
  fileName,
  outputRoot,
}: GenerateParams & { apiGroup: ApiGroup }) {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputPath = path.join(outputRoot, `${fileName}.d.ts`);
  const absInput = path.resolve(rootPath, apiGroup.appTypePath);

  // Clean up any existing file first to avoid stale data
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
    debug("Removed existing type file: %s", outputPath);
  }

  // Remove any existing source file from the project to avoid cached AST data
  const existingFile = project.getSourceFile(absInput);
  if (existingFile) {
    project.removeSourceFile(existingFile);
    debug("Removed cached source file from ts-morph project: %s", absInput);
  }
  
  const sourceFile = project.addSourceFileAtPath(absInput);
  const typeAliases = sourceFile.getTypeAliases();
  const interfaces = sourceFile.getInterfaces();

  let result = `// AUTO-GENERATED from ${apiGroup.appTypePath}\n\n`;

  typeAliases.forEach((alias) => {
    const raw = alias.getType().getText(alias);
    const clean = normalizeImportPaths(raw);
    result += `export type ${alias.getName()} = ${clean};\n\n`;
  });

  interfaces.forEach((intf) => {
    result += intf.getText() + "\n\n";
  });

  const preContent = config.preDefineTypeContent || "";

  fs.writeFileSync(outputPath, `${preContent}\n${result}`, "utf-8");
  debug("Generated types for %s -> %s", apiGroup.appTypePath, outputPath);
  return { appTypePath: outputPath, name: fileName };
}
