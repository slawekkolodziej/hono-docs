import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import fs from "node:fs/promises";
import path from "node:path";
import { doc } from "../../dist/index.js";

const app = new Hono()
  .get(
    "/health",
    doc({
      summary: "Health check endpoint",
      description: `
        Returns the current status of the API service
        Sometimes can return something else :D

        - list item 1
        - list item 2
      `,
      tags: ["Health", "Monitoring"],
    }),
    (c) => c.json({ status: "ok", timestamp: new Date() })
  )

  .get(
    "/users",
    doc({
      summary: "List all users",
      description: "Retrieve a paginated list of users with optional filtering",
      tags: ["Users"],
    }),
    (c) => c.json({ users: [], total: 0 })
  )

  .get(
    "/users/:id",
    doc({
      summary: "Get user by ID",
      description: `# Retrieve detailed information about a specific user by their unique ID

hello
      `,
      tags: ["Users"],
    }),
    (c) =>
      c.json({
        id: c.req.param("id"),
        name: "John Doe",
        email: "john@example.com",
      })
  )

  .post(
    "/users",
    doc({
      summary: "Create new user",
      description: "Create a new user account with the provided data",
      tags: ["Users", "Admin"],
    }),
    (c) => c.json({ id: "123", message: "User created" })
  )

  .get(
    "/legacy",
    doc({
      summary: "Legacy endpoint",
      description: "This endpoint is deprecated and will be removed in v2.0",
      tags: ["Legacy"],
      deprecated: true,
    }),
    (c) => c.json({ message: "This endpoint is deprecated" })
  )

  .get(
    "/docs",
    Scalar({
      url: "/open-api",
      theme: "kepler",
      layout: "modern",
      defaultHttpClient: { targetKey: "js", clientKey: "axios" },
    })
  )
  .get("/open-api", async (c) => {
    const raw = await fs.readFile(
      path.join(process.cwd(), "./openapi.json"),
      "utf-8"
    );
    return c.json(JSON.parse(raw));
  });

export type AppType = typeof app;
export default app;
