import { Hono } from "hono";
import {
  createdResponse,
  docsResponse,
  loginResponse,
  logoutResponse,
  usersResponse,
} from "./schemas";

const docsRouter = new Hono()
  .get("/docs", (c) => c.json(docsResponse))
  .get("/docs/:id", (c) => c.json({ docId: c.req.param("id") }));

const usersRouter = new Hono()
  .get("/users", (c) => c.json(usersResponse))
  .post("/users", (c) => c.json(createdResponse))
  .get("/users/:id", (c) => c.json({ userId: c.req.param("id") }));

const authRouter = new Hono()
  .post("/login", (c) => c.json(loginResponse))
  .post("/logout", (c) => c.json(logoutResponse));

const app = new Hono()
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/api/v1", docsRouter)
  .route("/api/v1", usersRouter)
  .route("/auth", authRouter);

export type AppType = typeof app;
export default app;
