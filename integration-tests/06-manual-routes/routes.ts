import { Hono } from "hono";

// Simple routes for manual route definition testing
const userRoutes = new Hono()
  .get("/", (c) => c.json({ message: "List all users" }))
  .get("/:id", (c) => c.json({ userId: c.req.param("id") }));

export type AppType = typeof userRoutes;