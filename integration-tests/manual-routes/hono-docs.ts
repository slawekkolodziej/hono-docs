import { defineConfig } from "@rcmade/hono-docs";

export default defineConfig({
  tsConfigPath: "./tsconfig.json",
  openApi: {
    openapi: "3.0.0",
    info: { 
      title: "Manual Routes Test API", 
      version: "1.0.0", 
      description: "Manual route definition pattern test" 
    },
    servers: [{ url: "http://localhost:3000/api" }],
  },
  outputs: {
    openApiJson: "./openapi.json",
  },
  apis: [
    {
      name: "User Routes",
      appTypePath: "./routes.ts",
      api: [
        { api: "/user", method: "get", tag: ["UserList"] },
        { api: "/user/:id", method: "get", tag: ["UserDetail"] },
      ],
    },
  ],
});
