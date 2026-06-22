import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import { zValidator } from "@hono/zod-validator";
import { vValidator } from "@hono/valibot-validator";
import { serveOpenAPI } from "hono-docs";
import { requireAuth } from "./auth";
import config from "./hono-docs.config";
import {
  CreateUserSchema,
  CreateUserSchemaV,
  UpdateUserSchema,
  users,
  VALID_USER_IDS,
} from "./schemas";

const app = new Hono()
  .get("/api/users", (c) => c.json({ users }))
  .get("/api/users/:id", (c) => {
    const id = c.req.param("id");

    if (!VALID_USER_IDS.includes(id)) {
      return c.json({ error: "User not found" }, 404);
    }

    const user = users.find((u) => u.id === id);
    return c.json({ user: user || { id } });
  })
  .post("/api/users", zValidator("json", CreateUserSchema), async (c) => {
    const body = c.req.valid("json");
    const newUser = { id: String(users.length + 1), ...body };
    users.push(newUser);
    return c.json({ created: newUser }, 201);
  })
  .put("/api/users/:id", zValidator("json", UpdateUserSchema), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    if (!id || !VALID_USER_IDS.includes(id)) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ updated: { id, ...body } });
  })
  .delete("/api/users/:id", (c) => {
    const id = c.req.param("id");

    if (!VALID_USER_IDS.includes(id)) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ deleted: id });
  })
  .post("/api/users/valibot", requireAuth, vValidator("json", CreateUserSchemaV), async (c) => {
    const body = c.req.valid("json");
    const newUser = { id: String(users.length + 100), ...body };
    return c.json({ created: newUser }, 201);
  })
  .get("/api/profile", requireAuth, (c) =>
    c.json({
      profile: {
        id: "current-user",
        name: "Current User",
        email: "user@example.com",
      },
    })
  )
  .get("/openapi.json", serveOpenAPI({ config }))
  .get(
    "/docs",
    Scalar({
      url: "./openapi.json",
    })
  );

export default app;
export type AppType = typeof app;
