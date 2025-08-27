import { defineConfig } from "@rcmade/hono-docs";

export default defineConfig({
  tsConfigPath: "./tsconfig.json",
  openApi: {
    openapi: "3.0.0",
    info: {
      title: "Simple Grouped App Test API",
      version: "1.0.0",
    },
  },
  outputs: {
    openApiJson: "./openapi.json",
  },
  apis: [
    {
      name: "Simple Grouped App",
      apiPrefix: "",
      appTypePath: "./src/routes.ts",
      // Intentionally leaving api array empty to test auto-discovery
    },
  ],
});