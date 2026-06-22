import { Hono } from 'hono'
import { doc } from 'hono-docs'

const users = [
  { id: '1', name: 'Ada Lovelace' },
  { id: '2', name: 'Grace Hopper' },
]

const app = new Hono()
  .get(
    '/users',
    doc({
      summary: 'List users',
      description: `
        Returns a static user list from a single-file Hono app.
      `,
      tags: ['Users'],
    }),
    (c) => c.json({ users })
  )
  .get(
    '/users/:id',
    doc({
      summary: 'Get user',
      description: `
        Shows how path parameters are inferred from a basic route.
      `,
      tags: ['Users'],
    }),
    (c) => {
      const user = users.find((item) => item.id === c.req.param('id'))

      if (!user) {
        return c.json({ error: 'User not found' }, 404)
      }

      return c.json({ user })
    }
  )
  .get('/health', (c) => c.json({ ok: true }))

export default app
export type AppType = typeof app
