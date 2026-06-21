import { defineConfig } from "@rcmade/hono-docs";

export default defineConfig({
  tsConfigPath: "./tsconfig.json",
  openApi: {
    openapi: "3.0.0",
    info: {
      title: "Complex Grouped App Test API",
      version: "1.0.0",
    },
  },
  outputs: {
    openApiJson: "./openapi.json",
  },
  name: "Complex Grouped App",
  appTypePath: "./routes.ts",
});