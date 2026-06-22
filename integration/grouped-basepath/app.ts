import { Hono } from "hono";
import { createdResponse, docsResponse, usersResponse } from "./schemas";

const docsRouter = new Hono()
  .get("/docs", (c) => c.json(docsResponse))
  .get("/docs/:id", (c) => c.json({ docId: c.req.param("id") }));

const usersRouter = new Hono()
  .get("/users", (c) => c.json(usersResponse))
  .post("/users", (c) => c.json(createdResponse))
  .get("/users/:id", (c) => c.json({ userId: c.req.param("id") }));

const app = new Hono()
  .basePath("/v1")
  .route("/", docsRouter)
  .route("/", usersRouter);

export type AppType = typeof app;
export default app;
