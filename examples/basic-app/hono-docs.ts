import { defineConfig } from "@rcmade/hono-docs";

export default defineConfig({
  tsConfigPath: "./tsconfig.json",
  openApi: {
    openapi: "3.0.0",
    info: { title: "My API", version: "1.0.0" },
    servers: [{ url: "http://localhost:3000" }],
  },
  outputs: {
    openApiJson: "./openapi/openapi.json",
  },
  apis: [
    {
      name: "User Routes",
      apiPrefix: "/user",
      appTypePath: "src/routes/authRoutes.ts",
      api: [
        { api: "/", method: "get", tag: ["UserList"] },
        { api: "/:id", method: "get", tag: ["UserDetail"] },
      ],
    },
  ],
});
