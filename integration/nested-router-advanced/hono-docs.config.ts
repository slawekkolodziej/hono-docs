import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Nested Router Advanced',
      version: '1.0.0',
      description: dedent`
        Multiple routers are mounted at different path prefixes.

        Works:

        - nested router composition
        - multiple mount points
        - unrelated route groups in the same app
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Nested Router Advanced',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
})
