import { Hono } from "hono";

// Individual route modules
const docsRoutes = new Hono()
  .get("/", (c) => c.json({ docs: "available" }))
  .get("/:id", (c) => c.json({ docId: c.req.param("id") }));

const userRoutes = new Hono()
  .get("/", (c) => c.json({ users: [] }))
  .post("/", (c) => c.json({ created: true }))
  .get("/:id", (c) => c.json({ userId: c.req.param("id") }));

// Nested grouping
const app = new Hono()
  .route("/api", new Hono()
    .route("/docs", docsRoutes)
    .route("/users", userRoutes)
  );

// Export the AppType
export type AppType = typeof app;