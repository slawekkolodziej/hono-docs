export type Example = {
  slug: string;
  name: string;
  pattern: string;
  description: string;
  mountPath: string;
};

export function openApiPath(example: Example): string {
  return `${example.mountPath}/openapi.json`;
}

export function scalarPath(example: Example): string {
  return `/examples/${example.slug}/scalar`;
}

export function swaggerPath(example: Example): string {
  return `/examples/${example.slug}/swagger`;
}

export const examples: Example[] = [
  {
    slug: "simple-router",
    name: "Simple Router",
    pattern: "Single Hono app",
    description:
      "The baseline fixture: one Hono instance defines the whole API directly, including path params, auth-only branches, Zod validation, and Valibot validation. Use it to check the simplest AppType inference path before route composition gets involved.",
    mountPath: "/integration/simple-router",
  },
  {
    slug: "grouped-simple",
    name: "Grouped Simple",
    pattern: "route() composition",
    description:
      "Two small routers are mounted into a parent app with route(). It is the first composition case: docs routes and user routes keep their local definitions, while hono-docs has to read the final mounted shape.",
    mountPath: "/integration/grouped-simple",
  },
  {
    slug: "grouped-basepath",
    name: "Grouped BasePath",
    pattern: "basePath() + groups",
    description:
      "The grouped-router case wrapped in basePath('/v1'). This catches whether generated OpenAPI paths include the shared version prefix without losing the child router paths.",
    mountPath: "/integration/grouped-basepath",
  },
  {
    slug: "grouped-complex",
    name: "Grouped Complex",
    pattern: "Mixed composition",
    description:
      "A parent app with unrelated route groups mounted at different prefixes: health checks, API v1 routes, and auth routes. It exercises mixed prefixes instead of one tidy shared route tree.",
    mountPath: "/integration/grouped-complex",
  },
  {
    slug: "grouped-nested",
    name: "Grouped Nested",
    pattern: "Nested route()",
    description:
      "Routers nested inside routers before they reach the exported app. This fixture checks that paths are flattened through multiple route() layers, including params owned by inner routers.",
    mountPath: "/integration/grouped-nested",
  },
  {
    slug: "manual-routes",
    name: "Manual Routes",
    pattern: "Config overrides",
    description:
      "A small route file paired with explicit route metadata in config. It shows how manually supplied summaries, tags, servers, and path metadata are layered over the inferred route list.",
    mountPath: "/integration/manual-routes",
  },
  {
    slug: "middleware-docs",
    name: "Middleware Docs",
    pattern: "doc() middleware",
    description:
      "Documentation lives next to the handler via doc() middleware. This is the inline-authoring path for operation summaries, markdown descriptions, tags, and deprecated endpoints.",
    mountPath: "/integration/middleware-docs",
  },
];

export function getExample(slug: string): Example | undefined {
  return examples.find((example) => example.slug === slug);
}
