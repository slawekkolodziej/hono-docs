import { fileURLToPath } from 'node:url'
import { defineConfig } from 'hono-docs'
import dedent from 'dedent'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Simple Router Test API',
      version: '1.0.0',
      description: dedent`
        One Hono instance defines the whole API directly in the \`app.ts\`. This includes:

        - path params
        - auth-only endpoints
        - annotating endpoints with \`doc()\` middleware

        This example uses Zod validator.
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Simple Router',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
  excludePaths: ['/docs', '/openapi.json'],
})
