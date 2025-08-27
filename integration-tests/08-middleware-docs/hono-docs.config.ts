import { defineConfig } from "@rcmade/hono-docs";

export default defineConfig({
  tsConfigPath: "./tsconfig.json",
  openApi: {
    openapi: "3.0.0",
    info: {
      title: "Middleware Docs Test API",
      version: "1.0.0",
      description: "Test demonstrating doc() middleware integration with hono-docs"
    },
  },
  outputs: {
    openApiJson: "./openapi.json",
  },
  apis: [
    {
      name: "Middleware Docs Test",
      apiPrefix: "/api/v1",
      appTypePath: "./routes.ts",
    },
  ],
});