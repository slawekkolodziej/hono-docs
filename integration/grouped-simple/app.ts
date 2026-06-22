import path from "node:path";
import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { zValidator } from "@hono/zod-validator";
import { serveOpenAPI } from "hono-docs";
import config from "./hono-docs.config";
import { occasionallyFails } from "./middleware";
import { CreateUserSchema, mockUsers, VALID_DOC_IDS } from "./schemas";

const rootPath = path.join(process.cwd(), "integration/grouped-simple");

const app = new Hono()
  .use("/docs", occasionallyFails)
  .get("/docs", (c) =>
    c.json(
      {
        docs: "available",
        totalDocs: VALID_DOC_IDS.length,
        availableDocs: VALID_DOC_IDS,
      },
      200
    )
  )
  .get("/docs/:id", (c) => {
    const id = c.req.param("id");

    if (!VALID_DOC_IDS.includes(id)) {
      return c.json({ error: "Documentation not found" }, 404);
    }

    return c.json(
      {
        docId: id,
        title: `${id} Documentation`,
        content: `Content for ${id}`,
      },
      200
    );
  })
  .get("/users", (c) =>
    c.json({
      users: mockUsers,
      total: mockUsers.length,
    })
  )
  .post("/users", zValidator("json", CreateUserSchema), (c) => {
    const body = c.req.valid("json");
    const newUser = { id: String(mockUsers.length + 1), ...body };
    return c.json({ created: newUser }, 201);
  })
  .get("/users/:id", (c) => {
    const id = c.req.param("id");
    const user = mockUsers.find((u) => u.id === id);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ userId: id, user });
  })
  .get("/openapi.json", serveOpenAPI({ config, rootPath }))
  .get("/swagger", swaggerUI({ url: "/openapi.json" }));

export type AppType = typeof app;
export default app;
