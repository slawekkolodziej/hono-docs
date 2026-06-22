import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'BasePath Grouped App Test API',
      version: '1.0.0',
      description: dedent`
        Grouped routers are wrapped in \`basePath('/v1')\`.

        This fixture checks that generated OpenAPI paths keep:

        - the shared version prefix
        - child router paths
        - path params
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'BasePath Grouped App',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
})
