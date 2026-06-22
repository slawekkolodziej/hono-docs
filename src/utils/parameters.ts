import { buildSchema } from "./buildSchema";

function getSymbolType(
  symbol: import("ts-morph").Symbol,
  location?: import("ts-morph").Node
) {
  const declaration = symbol.getValueDeclaration() || symbol.getDeclarations()[0];
  return (location ? symbol.getTypeAtLocation(location) : undefined) || declaration?.getType();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function genParameters(
  type: import("ts-morph").Type,
  location?: import("ts-morph").Node
): any[] {
  const inputSymbol = type.getProperty("input");
  const input = inputSymbol ? getSymbolType(inputSymbol, location) : undefined;
  if (!input) return [];
  const sources = ["query", "param", "header", "cookie"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any[] = [];
  for (const src of sources) {
    const p = input.getProperty(src);
    if (!p) continue;
    const srcType = getSymbolType(p, location);
    if (!srcType) continue;
    for (const f of srcType.getProperties()) {
      const ft = getSymbolType(f, location);
      if (!ft) continue;
      params.push({
        name: f.getName(),
        in: src === "param" ? "path" : src,
        required: !f.isOptional(),
        schema: buildSchema(ft, location),
      });
    }
  }
  return params;
}
