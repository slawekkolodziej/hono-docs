import { Hono } from "hono";
import { listUsersResponse } from "./schemas";

const app = new Hono()
  .get("/user", (c) => c.json(listUsersResponse))
  .get("/user/:id", (c) => c.json({ userId: c.req.param("id") }));

export type AppType = typeof app;
export default app;
