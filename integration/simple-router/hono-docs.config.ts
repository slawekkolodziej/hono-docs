import { fileURLToPath } from 'node:url'
import { defineConfig } from 'hono-docs'
import dedent from 'dedent'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Simple Router',
      version: '1.0.0',
      description: dedent`
        A minimal Hono app where every route lives in one \`app.ts\` file.

        Works:

        - static JSON responses
        - path parameter inference
        - response status inference from handler branches
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Simple Router',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
})
