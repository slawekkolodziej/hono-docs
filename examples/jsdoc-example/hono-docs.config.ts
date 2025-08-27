import { defineConfig } from "@rcmade/hono-docs";

export default defineConfig({
  tsConfigPath: "../tsconfig.json",
  openApi: {
    openapi: "3.0.0",
    info: {
      title: "JSDoc Example API",
      version: "1.0.0",
      description: "Example API demonstrating JSDoc integration with hono-docs"
    },
  },
  outputs: {
    openApiJson: "./openapi.json",
  },
  apis: [
    {
      name: "JSDoc Example",
      apiPrefix: "/api/v1",
      appTypePath: "./routes.ts",
    },
  ],
});