import { Hono } from "hono";

// Individual route modules
const docsRoutes = new Hono()
  .get("/docs", (c) => c.json({ docs: "available" }))
  .get("/docs/:id", (c) => c.json({ docId: c.req.param("id") }));

const userRoutes = new Hono()
  .get("/users", (c) => c.json({ users: [] }))
  .post("/users", (c) => c.json({ created: true }))
  .get("/users/:id", (c) => c.json({ userId: c.req.param("id") }));

// Simple grouped app - this creates a union type
const app = new Hono().route("/", docsRoutes).route("/", userRoutes);

// Export the AppType - this should create a union type internally
export type AppType = typeof app;
