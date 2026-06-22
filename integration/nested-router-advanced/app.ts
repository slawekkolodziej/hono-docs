import { Hono } from 'hono'

const docsRouter = new Hono()
  .get('/docs', (c) =>
    c.json({
      docs: [{ id: 'intro', title: 'Intro' }],
    })
  )
  .get('/docs/:id', (c) =>
    c.json({ doc: { id: c.req.param('id') } })
  )

const usersRouter = new Hono()
  .get('/users', (c) =>
    c.json({
      users: [{ id: '1', name: 'Ada Lovelace' }],
    })
  )
  .post('/users', (c) => c.json({ created: true }, 201))

const apiRouter = new Hono()
  .route('/', docsRouter)
  .route('/', usersRouter)

const authRouter = new Hono()
  .post('/login', (c) => c.json({ token: 'example-token' }))
  .post('/logout', (c) => c.json({ ok: true }))

const app = new Hono()
  .get('/health', (c) => c.json({ ok: true }))
  .route('/api/v1', apiRouter)
  .route('/auth', authRouter)

export default app
export type AppType = typeof app
