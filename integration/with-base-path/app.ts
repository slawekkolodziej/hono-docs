import { Hono } from 'hono'

const app = new Hono()
  .basePath('/v1')
  .get('/status', (c) => c.json({ ok: true }))
  .get('/users/:id', (c) => c.json({ user: { id: c.req.param('id') } }))

export default app
export type AppType = typeof app
