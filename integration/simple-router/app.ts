import { Hono } from 'hono'
import { Scalar } from '@scalar/hono-api-reference'
import { zValidator } from '@hono/zod-validator'
import dedent from 'dedent'
import { doc, serveOpenAPI } from 'hono-docs'
import { requireAuth } from './auth'
import config from './hono-docs.config'
import { CreateUserSchema, UpdateUserSchema, users, VALID_USER_IDS } from './schemas'

const app = new Hono()
  .get(
    '/api/users',
    doc({
      summary: 'List users',
      description: dedent`
        Returns the in-memory users used by the **simple-router** fixture.

        This route is intentionally small so the generated OpenAPI output is easy to inspect.
      `,
      tags: ['Users'],
    }),
    (c) => c.json({ users })
  )
  .get(
    '/api/users/:id',
    doc({
      summary: 'Get user',
      description: dedent`
        Returns a user by \`id\`.

        - \`200\` when the fixture user exists
        - \`404\` when the id is unknown
      `,
      tags: ['Users'],
    }),
    (c) => {
      const id = c.req.param('id')

      if (!VALID_USER_IDS.includes(id)) {
        return c.json({ error: 'User not found' }, 404)
      }

      const user = users.find((u) => u.id === id)
      return c.json({ user: user || { id } })
    }
  )
  .post(
    '/api/users',
    doc({
      summary: 'Create user with Zod',
      description: dedent`
        Validates the JSON body with **@hono/zod-validator** before creating a user.

        Required fields:

        - \`name\`
        - \`email\`
      `,
      tags: ['Users', 'Validation'],
    }),
    zValidator('json', CreateUserSchema),
    async (c) => {
      const body = c.req.valid('json')
      const newUser = { id: String(users.length + 1), ...body }
      users.push(newUser)
      return c.json({ created: newUser }, 201)
    }
  )
  .put('/api/users/:id', zValidator('json', UpdateUserSchema), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')

    if (!id || !VALID_USER_IDS.includes(id)) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ updated: { id, ...body } })
  })
  .delete('/api/users/:id', (c) => {
    const id = c.req.param('id')

    if (!VALID_USER_IDS.includes(id)) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ deleted: id })
  })
  .get(
    '/api/profile',
    doc({
      summary: 'Get current profile',
      description: dedent`
        Shows \`doc()\` middleware alongside an authenticated route.

        Send the configured bearer token to avoid the \`401\` branch.
      `,
      tags: ['Auth', 'Profile'],
    }),
    requireAuth,
    (c) =>
      c.json({
        profile: {
          id: 'current-user',
          name: 'Current User',
          email: 'user@example.com',
        },
      })
  )
  .get('/openapi.json', serveOpenAPI({ config }))
  .get(
    '/docs',
    Scalar({
      url: './openapi.json',
    })
  )

export default app
export type AppType = typeof app
