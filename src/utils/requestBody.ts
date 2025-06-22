import { buildSchema } from "./buildSchema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function genRequestBody(type: import("ts-morph").Type): any | null {
  const inp = type.getProperty("input")?.getValueDeclarationOrThrow().getType();
  if (!inp) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: Record<string, any> = {};
  const j = inp.getProperty("json");
  if (j) {
    content["application/json"] = {
      schema: buildSchema(j.getValueDeclarationOrThrow().getType()),
    };
  }
  const f = inp.getProperty("form");
  if (f) {
    content["multipart/form-data"] = {
      schema: buildSchema(f.getValueDeclarationOrThrow().getType()),
    };
  }
  return Object.keys(content).length ? { required: true, content } : null;
}
