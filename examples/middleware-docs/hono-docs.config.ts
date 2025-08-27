import { defineConfig } from "@rcmade/hono-docs";

export default defineConfig({
  tsConfigPath: "../../tsconfig.json",
  openApi: {
    openapi: "3.0.0",
    info: {
      title: "Middleware Docs Example API",
      version: "1.0.0",
      description: "Example API demonstrating doc() middleware integration with hono-docs"
    },
  },
  outputs: {
    openApiJson: "./openapi.json",
  },
  apis: [
    {
      name: "Middleware Docs Example",
      apiPrefix: "/api/v1",
      appTypePath: "./routes.ts",
    },
  ],
});