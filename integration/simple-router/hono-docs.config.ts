import { fileURLToPath } from 'node:url'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Simple Router Test API',
      version: '1.0.0',
      description: 'Simple non-grouped router pattern test',
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Simple Router',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
  excludePaths: ['/docs', '/openapi.json'],
})
