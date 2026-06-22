import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Nested Router',
      version: '1.0.0',
      description: dedent`
        Two routers are merged into the root app with \`.route('/', otherRouter)\`.

        Works:

        - root-level router composition
        - paths inferred from imported router instances
        - path parameters kept after router merging
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Nested Router',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
})
