import { defineConfig } from "@rcmade/hono-docs";

export default defineConfig({
  tsConfigPath: "./tsconfig.json",
  openApi: {
    openapi: "3.0.0",
    info: {
      title: "Simple Router Test API",
      version: "1.0.0",
      description: "Simple non-grouped router pattern test"
    },
  },
  outputs: {
    openApiJson: "./openapi.json",
  },
  name: "Simple Router",
  appTypePath: "./routes.ts",
  excludePaths: ["/docs"],
});