import { Context, Hono, Next } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { serveOpenAPI } from "@rcmade/hono-docs";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { hc } from "hono/client";

// Mock data
const mockUsers = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
];

const VALID_DOC_IDS = ["api-guide", "getting-started", "authentication"];

// Zod validation schemas
const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
});

// Individual route modules (enhanced with validation and better responses)
const docsRoutes = new Hono()
  .get("/docs", (c) =>
    c.json({
      docs: "available",
      totalDocs: VALID_DOC_IDS.length,
      availableDocs: VALID_DOC_IDS,
    }, 200)
  )
  .get("/docs/:id", (c) => {
    const id = c.req.param("id");

    if (!VALID_DOC_IDS.includes(id)) {
      return c.json({ error: "Documentation not found" }, 404);
    }

    return c.json({
      docId: id,
      title: `${id} Documentation`,
      content: `Content for ${id}`,
    }, 200);
  });

const userRoutes = new Hono()
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
  });

const middleware = async (c: Context, next: Next) => {
  if (Math.random() > 0.99) {
    return c.json({ error: true }, 500);
  }

  return await next();
};

// Simple grouped app with Swagger UI - same pattern as simple-router
const app = new Hono()
  .use("/docs", middleware)
  .route("/", docsRoutes)
  .route("/", userRoutes)
  // Serve OpenAPI JSON spec automatically
  .get("/openapi.json", serveOpenAPI())
  // Swagger UI documentation
  .get("/swagger", swaggerUI({ url: "/openapi.json" }));

// Export the AppType - this should create a union type internally
export type AppType = typeof app;
export default app;


const _app2 = new Hono()
  .use(middleware)
  .get('/foo', c => c.text('hello!!!', 200));

type AppType2 = typeof _app2;

const client = hc<AppType2>('http://localhost');
