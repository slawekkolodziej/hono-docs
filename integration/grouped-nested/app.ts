import { Hono } from "hono";
import { createdResponse, docsResponse, usersResponse } from "./schemas";

const docsRouter = new Hono()
  .get("/", (c) => c.json(docsResponse))
  .get("/:id", (c) => c.json({ docId: c.req.param("id") }));

const usersRouter = new Hono()
  .get("/", (c) => c.json(usersResponse))
  .post("/", (c) => c.json(createdResponse))
  .get("/:id", (c) => c.json({ userId: c.req.param("id") }));

const apiRouter = new Hono()
  .route("/docs", docsRouter)
  .route("/users", usersRouter);

const app = new Hono()
  .route("/api", apiRouter);

export type AppType = typeof app;
export default app;
