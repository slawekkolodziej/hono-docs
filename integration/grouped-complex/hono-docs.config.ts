import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Complex Grouped App Test API',
      version: '1.0.0',
      description: dedent`
        Multiple unrelated route groups are mounted at different prefixes:

        - health checks
        - API v1 resources
        - auth endpoints

        This catches mixed composition cases that are less tidy than one shared route tree.
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Complex Grouped App',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
})
