import { createMiddleware } from 'hono/factory'

export interface DocConfig {
  summary?: string
  description?: string  
  tags?: string[]
  deprecated?: boolean
}

// Symbol to mark documentation middleware for type extraction
const DOC_SYMBOL = Symbol('hono-docs');

/**
 * Documentation middleware that adds metadata to routes without affecting runtime behavior.
 * This metadata can be extracted during type analysis for OpenAPI generation.
 * 
 * @example
 * ```typescript
 * app.get(
 *   "/users/:id",
 *   doc({
 *     summary: "Get user by ID",
 *     description: "Retrieve detailed information about a user",
 *     tags: ["Users"]
 *   }),
 *   (c) => c.json({ userId: c.req.param("id") })
 * )
 * ```
 */
export const doc = (config: DocConfig) => {
  const middleware = createMiddleware(async (_c, next) => {
    // This middleware is a no-op at runtime - it exists purely for type-level documentation
    await next()
  });
  
  // Attach the config to the middleware function for type extraction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (middleware as any)[DOC_SYMBOL] = config;
  
  return middleware;
}

// Export the symbol so it can be used in type extraction
export { DOC_SYMBOL };