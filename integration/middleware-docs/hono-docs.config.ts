import { fileURLToPath } from 'node:url'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Middleware Docs Test API',
      version: '1.0.0',
      description: 'Test demonstrating doc() middleware integration with hono-docs',
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Middleware Docs Test',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
})
