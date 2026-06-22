import { bearerAuth } from 'hono/bearer-auth'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { Hono } from 'hono'
import { Scalar } from '@scalar/hono-api-reference'
import { doc, serveOpenAPI } from 'hono-docs'
import config from './hono-docs.config'
import { projectsRouter } from './projects'
import { reportsRouter } from './reports'
import { usersRouter } from './users'

const app = new Hono()
  .use('*', logger())
  .use('*', secureHeaders())
  .use(
    '/api/*',
    cors({
      origin: 'https://dashboard.example.com',
      allowHeaders: ['authorization', 'content-type'],
      allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    })
  )
  .use('/api/*', bearerAuth({ token: 'secret-token' }))
  .get(
    '/health',
    doc({
      summary: 'Health check',
      description: `
        Public liveness endpoint outside the
        authenticated API surface.
      `,
      tags: ['System'],
    }),
    (c) => c.json({ ok: true })
  )
  .route('/api/users', usersRouter)
  .route('/api/projects', projectsRouter)
  .route('/api/reports', reportsRouter)
  .get(
    '/docs',
    Scalar({
      url: '/openapi.json',
      theme: 'kepler',
      layout: 'modern',
    })
  )
  .get('/openapi.json', serveOpenAPI({ config }))

export default app
export type AppType = typeof app
