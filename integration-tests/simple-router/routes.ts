import { Hono } from "hono";

const app = new Hono();

// Simple GET route
app.get("/users", (c) => {
  return c.json({ users: [] });
});

// Route with path parameter
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ user: { id } });
});

// POST route with JSON body
app.post("/users", async (c) => {
  const body = await c.req.json();
  return c.json({ created: body }, 201);
});

// PUT route with validation
app.put("/users/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  return c.json({ updated: { id, ...body } });
});

// DELETE route
app.delete("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ deleted: id });
});

export default app;
export type AppType = typeof app;