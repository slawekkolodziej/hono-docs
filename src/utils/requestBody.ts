import { buildSchema } from "./buildSchema";

function getSymbolType(
  symbol: import("ts-morph").Symbol,
  location?: import("ts-morph").Node
) {
  const declaration = symbol.getValueDeclaration() || symbol.getDeclarations()[0];
  return (location ? symbol.getTypeAtLocation(location) : undefined) || declaration?.getType();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function genRequestBody(
  type: import("ts-morph").Type,
  location?: import("ts-morph").Node
): any | null {
  const inputSymbol = type.getProperty("input");
  const inp = inputSymbol ? getSymbolType(inputSymbol, location) : undefined;
  if (!inp) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: Record<string, any> = {};
  const j = inp.getProperty("json");
  if (j) {
    const jsonType = getSymbolType(j, location);
    if (jsonType) {
      content["application/json"] = {
        schema: buildSchema(jsonType, location),
      };
    }
  }
  const f = inp.getProperty("form");
  if (f) {
    const formType = getSymbolType(f, location);
    if (formType) {
      content["multipart/form-data"] = {
        schema: buildSchema(formType, location),
      };
    }
  }
  return Object.keys(content).length ? { required: true, content } : null;
}
