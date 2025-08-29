import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import { serveOpenAPI } from "@rcmade/hono-docs";

const app = new Hono()
  // Simple GET route
  .get("/api/users", (c) => {
    return c.json({ users: [] });
  })

  // Route with path parameter
  .get("/api/users/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ user: { id } });
  })

  // POST route with JSON body
  .post("/api/users", async (c) => {
    const body = await c.req.json();
    return c.json({ created: body }, 201);
  })

  // PUT route with validation
  .put("/api/users/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    return c.json({ updated: { id, ...body } });
  })

  // DELETE route
  .delete("/api/users/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ deleted: id });
  })

  // Serve OpenAPI JSON spec automatically
  .get("/openapi.json", serveOpenAPI())

  // Scalar API documentation
  .get(
    "/docs",
    Scalar({
      url: "/openapi.json",
    })
  );

export default app;
export type AppType = typeof app;