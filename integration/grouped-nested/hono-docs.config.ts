import { fileURLToPath } from 'node:url'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Nested Grouped App Test API',
      version: '1.0.0',
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Nested Grouped App',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
})
