export function sanitizeApiPrefix(prefix: string): string {
  return prefix
    .replace(/^\//, "")
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((seg, i) =>
      i === 0
        ? seg.toLowerCase()
        : seg[0].toUpperCase() + seg.slice(1).toLowerCase()
    )
    .join("");
}

export function unwrapUnion(
  type: import("ts-morph").Type
): import("ts-morph").Type[] {
  return type.isUnion() ? type.getUnionTypes() : [type];
}

export function normalizeImportPaths(typeText: string): string {
  return typeText.replace(/from ["'].*node_modules\/(.*)["']/g, `from "$1"`);
}

export function cleanDefaultResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operation: any,
  pathKey: string,
  method: string
) {
  const defaultResponse = operation.responses?.default;
  if (!defaultResponse) return;

  const desc = defaultResponse.description ?? "";

  if (desc.includes("import(")) {
    const content = defaultResponse.content;

    if (content && Object.keys(content).length > 0) {
      defaultResponse.description = "Default fallback response";
      console.log(
        `ℹ️ Cleaned 'default' description in ${method.toUpperCase()} ${pathKey}`
      );
    } else {
      delete operation.responses.default;
      console.log(
        `🗑️ Removed empty 'default' in ${method.toUpperCase()} ${pathKey}`
      );
    }
  }
}


export function groupBy<T>(
  arr: T[],
  fn: (x: T) => string
): Record<string, T[]> {
  return arr.reduce((acc, x) => {
    (acc[fn(x)] ||= []).push(x);
    return acc;
  }, {} as Record<string, T[]>);
}
