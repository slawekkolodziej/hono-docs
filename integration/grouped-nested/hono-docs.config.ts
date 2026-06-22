import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Nested Grouped App Test API',
      version: '1.0.0',
      description: dedent`
        Routers are nested inside routers before they reach the exported app.

        This fixture checks that paths flatten through multiple \`route()\` layers, including
        dynamic params owned by inner routers.
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Nested Grouped App',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
})
