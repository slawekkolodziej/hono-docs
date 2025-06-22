import { buildSchema } from "./buildSchema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function genParameters(type: import("ts-morph").Type): any[] {
  const input = type
    .getProperty("input")
    ?.getValueDeclarationOrThrow()
    .getType();
  if (!input) return [];
  const sources = ["query", "param", "header", "cookie"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any[] = [];
  for (const src of sources) {
    const p = input.getProperty(src);
    if (!p) continue;
    const srcType = p.getValueDeclarationOrThrow().getType();
    for (const f of srcType.getProperties()) {
      const ft = f.getValueDeclarationOrThrow().getType();
      params.push({
        name: f.getName(),
        in: src === "param" ? "path" : src,
        required: !f.isOptional(),
        schema: buildSchema(ft),
      });
    }
  }
  return params;
}
