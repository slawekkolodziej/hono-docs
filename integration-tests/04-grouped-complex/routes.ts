import { Hono } from "hono";

// Individual route modules
const docsRoutes = new Hono()
  .get("/docs", (c) => c.json({ docs: "available" }))
  .get("/docs/:id", (c) => c.json({ docId: c.req.param("id") }));

const userRoutes = new Hono()
  .get("/users", (c) => c.json({ users: [] }))
  .post("/users", (c) => c.json({ created: true }))
  .get("/users/:id", (c) => c.json({ userId: c.req.param("id") }));

const authRoutes = new Hono()
  .post("/login", (c) => c.json({ token: "jwt-token" }))
  .post("/logout", (c) => c.json({ loggedOut: true }));

// Complex grouped app with mixed composition
const app = new Hono()
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/api/v1", docsRoutes)
  .route("/api/v1", userRoutes)
  .route("/auth", authRoutes);

// Export the AppType
export type AppType = typeof app;
