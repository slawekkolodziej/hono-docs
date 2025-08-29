import { Hono } from "hono";

// Simple routes for manual route definition testing
const userRoutes = new Hono()
  .get("/user", (c) => c.json({ message: "List all users" }))
  .get("/user/:id", (c) => c.json({ userId: c.req.param("id") }));

export type AppType = typeof userRoutes;
export default userRoutes;