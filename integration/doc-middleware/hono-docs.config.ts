import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Doc Middleware',
      version: '1.0.0',
      description: dedent`
        Documentation lives next to each handler through \`doc()\` middleware.

        Works:

        - inline summaries
        - markdown descriptions
        - operation tags
        - deprecated endpoints
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Doc Middleware',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
  excludePaths: ['/docs', '/openapi.json'],
})
