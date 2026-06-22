import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'With Base Path',
      version: '1.0.0',
      description: dedent`
        A focused \`.basePath('/v1')\` example.

        Works:

        - base path prefixes in generated OpenAPI paths
        - path parameter inference after the base path prefix
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'With Base Path',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
})
