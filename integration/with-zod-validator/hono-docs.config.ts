import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'With Zod Validator',
      version: '1.0.0',
      description: dedent`
        A small Hono app using \`@hono/zod-validator\`.

        Works:

        - JSON body schema inference
        - query parameter schema inference
        - path parameter schema inference
        - validator error responses
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'With Zod Validator',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
})
