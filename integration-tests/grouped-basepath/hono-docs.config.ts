import { defineConfig } from "@rcmade/hono-docs";

export default defineConfig({
  tsConfigPath: "./tsconfig.json",
  openApi: {
    openapi: "3.0.0",
    info: {
      title: "BasePath Grouped App Test API",
      version: "1.0.0",
    },
  },
  outputs: {
    openApiJson: "./openapi.json",
  },
  apis: [
    {
      name: "BasePath Grouped App",
      appTypePath: "./routes.ts",
    },
  ],
});