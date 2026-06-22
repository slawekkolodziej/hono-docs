import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Simple Grouped App Test API',
      version: '1.0.0',
      description: dedent`
        Two route groups are mounted into one Hono app.

        This fixture shows how generated OpenAPI paths preserve docs and users routes while keeping
        inline \`doc()\` metadata next to selected handlers.
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Simple Grouped App',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
  excludePaths: ['/openapi.json', '/swagger'],
})
