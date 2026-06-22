import { fileURLToPath } from 'node:url'
import dedent from 'dedent'
import { defineConfig } from 'hono-docs'

export default defineConfig({
  tsConfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  openApi: {
    openapi: '3.0.0',
    info: {
      title: 'Real World App',
      version: '1.0.0',
      description: dedent`
        A modular Hono app with authentication,
        common middleware, validation, and route
        documentation.

        Covers:

        - protected API routes
        - shared Hono middleware
        - multiple route modules
        - JSON, query, and param validation
      `,
    },
  },
  outputs: {
    openApiJson: fileURLToPath(new URL('./openapi.json', import.meta.url)),
  },
  name: 'Real World App',
  appTypePath: fileURLToPath(new URL('./app.ts', import.meta.url)),
  api: [
    {
      api: '/api/users',
      method: 'get',
      summary: 'Search users',
      description: 'Returns users visible to the authenticated member.',
      tag: ['Users'],
    },
    {
      api: '/api/users/{userId}',
      method: 'get',
      summary: 'Get user profile',
      description: 'Loads a single user profile by UUID.',
      tag: ['Users'],
    },
    {
      api: '/api/users',
      method: 'post',
      summary: 'Create user',
      description: 'Creates a workspace user.',
      tag: ['Users', 'Admin'],
    },
    {
      api: '/api/projects',
      method: 'get',
      summary: 'List projects',
      description: 'Lists projects with dashboard filters.',
      tag: ['Projects'],
    },
    {
      api: '/api/projects',
      method: 'post',
      summary: 'Create project',
      description: 'Creates a project owned by a workspace user.',
      tag: ['Projects'],
    },
    {
      api: '/api/projects/{projectId}/status',
      method: 'patch',
      summary: 'Update project status',
      description: 'Updates lifecycle state through an admin workflow.',
      tag: ['Projects', 'Admin'],
    },
    {
      api: '/api/reports/monthly',
      method: 'get',
      summary: 'Get monthly report',
      description: 'Reads a reporting view with query validation.',
      tag: ['Reports'],
    },
    {
      api: '/api/reports/exports',
      method: 'post',
      summary: 'Queue report export',
      description: 'Starts an asynchronous export job.',
      tag: ['Reports'],
    },
  ],
  excludePaths: ['/docs', '/openapi.json'],
})
