import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Manual Routes Test API',
      version: '1.0.0',
      description: dedent`
        A small Hono app is paired with explicit route metadata in config.

        This shows how manual metadata is layered over inferred routes:

        - summaries
        - tags
        - servers
        - path metadata
      `,
    },
    servers: [{ url: 'http://localhost:3000/api' }],
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'User Routes',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
  api: [
    { api: '/user', method: 'get', tag: ['UserList'] },
    { api: '/user/:id', method: 'get', tag: ['UserDetail'] },
  ],
})
