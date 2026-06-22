import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Middleware Response',
      version: '1.0.0',
      description: dedent`
        A focused unsupported case for middleware-returned responses.

        Not supported yet:

        - middleware can return a response at runtime
        - current Hono route types do not expose that response in the app schema
        - hono-docs therefore cannot infer the middleware response status yet

        This fixture is intentionally a backing case for the Hono type change.
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Middleware Response',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
})
