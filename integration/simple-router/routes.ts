import { Context, Hono, Next } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import { serveOpenAPI } from "@rcmade/hono-docs";
import { zValidator } from "@hono/zod-validator";
import { vValidator } from "@hono/valibot-validator";
import { z } from "zod";
import * as v from "valibot";

// Mock database
const VALID_USER_IDS = ["1", "2", "3", "42"];
const users = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
  { id: "3", name: "Charlie", email: "charlie@example.com" },
];

// Zod schemas
const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

// Valibot schemas
const CreateUserSchemaV = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  email: v.pipe(v.string(), v.email("Invalid email format")),
});

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
const requireAuth = async (c: Context, next: Next) => {
  const auth = c.req.header("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized - Bearer token required" }, 401);
  }
  return next();
};

const app = new Hono()
  // Simple GET route
  .get("/api/users", (c) => c.json({ users }))

  // Route with path parameter + 404 handling
  .get("/api/users/:id", (c) => {
    const id = c.req.param("id");

    // Check if ID exists in our "database"
    if (!VALID_USER_IDS.includes(id)) {
      return c.json({ error: "User not found" }, 404);
    }

    const user = users.find((u) => u.id === id);
    return c.json({ user: user || { id } });
  })

  // POST route with Zod validation (400 errors)
  .post("/api/users", zValidator("json", CreateUserSchema), async (c) => {
    const body = c.req.valid("json");
    const newUser = { id: String(users.length + 1), ...body };
    users.push(newUser);
    return c.json({ created: newUser }, 201);
  })

  // PUT route with Zod validation + 404 handling
  .put("/api/users/:id", zValidator("json", UpdateUserSchema), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    // Check if user exists
    if (!id || !VALID_USER_IDS.includes(id)) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ updated: { id, ...body } });
  })

  // DELETE route with 404 handling
  .delete("/api/users/:id", (c) => {
    const id = c.req.param("id");

    if (!VALID_USER_IDS.includes(id)) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ deleted: id });
  })

  // Protected route with 401 handling
  .get("/api/profile", requireAuth, (c) => {
    return c.json({
      profile: {
        id: "current-user",
        name: "Current User",
        email: "user@example.com",
      },
    });
  })

  // Valibot validation example (alternative to Zod)
  .post(
    "/api/users/valibot",
    requireAuth,
    vValidator("json", CreateUserSchemaV),
    async (c) => {
      const body = c.req.valid("json");
      const newUser = { id: String(users.length + 100), ...body };
      return c.json({ created: newUser }, 201);
    }
  )

  // Serve OpenAPI JSON spec automatically
  .get("/openapi.json", serveOpenAPI())

  // Scalar API documentation
  .get(
    "/docs",
    Scalar({
      url: "/openapi.json",
    })
  );

export default app;
export type AppType = typeof app;
