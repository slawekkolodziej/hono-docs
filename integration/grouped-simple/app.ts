import path from 'node:path'
import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { zValidator } from '@hono/zod-validator'
import dedent from 'dedent'
import { doc, serveOpenAPI } from 'hono-docs'
import config from './hono-docs.config'
import { occasionallyFails } from './middleware'
import { CreateUserSchema, mockUsers, VALID_DOC_IDS } from './schemas'

const rootPath = path.join(process.cwd(), 'integration/grouped-simple')

const app = new Hono()
  .use('/docs', occasionallyFails)
  .get(
    '/docs',
    doc({
      summary: 'List docs',
      description: dedent`
        Lists documentation records from the **docs route group**.

        The route also runs \`occasionallyFails\`, so generated docs include the successful shape
        while the app still demonstrates middleware composition.
      `,
      tags: ['Docs', 'Grouped routes'],
    }),
    (c) =>
      c.json(
        {
          docs: 'available',
          totalDocs: VALID_DOC_IDS.length,
          availableDocs: VALID_DOC_IDS,
        },
        200
      )
  )
  .get(
    '/docs/:id',
    doc({
      summary: 'Get doc',
      description: dedent`
        Returns one grouped docs route by \`id\`.

        - \`200\` for known fixture ids
        - \`404\` for unknown docs
      `,
      tags: ['Docs', 'Grouped routes'],
    }),
    (c) => {
      const id = c.req.param('id')

      if (!VALID_DOC_IDS.includes(id)) {
        return c.json({ error: 'Documentation not found' }, 404)
      }

      return c.json(
        {
          docId: id,
          title: `${id} Documentation`,
          content: `Content for ${id}`,
        },
        200
      )
    }
  )
  .get(
    '/users',
    doc({
      summary: 'List grouped users',
      description: dedent`
        Lists users from the second route group mounted in the same Hono app.

        This makes it easier to compare sibling route groups in the generated OpenAPI output.
      `,
      tags: ['Users', 'Grouped routes'],
    }),
    (c) =>
      c.json({
        users: mockUsers,
        total: mockUsers.length,
      })
  )
  .post(
    '/users',
    doc({
      summary: 'Create grouped user',
      description: dedent`
        Shows \`doc()\` middleware before a **Zod** validator in a grouped route example.

        Required fields:

        - \`name\`
        - \`email\`
      `,
      tags: ['Users', 'Validation', 'Grouped routes'],
    }),
    zValidator('json', CreateUserSchema),
    (c) => {
      const body = c.req.valid('json')
      const newUser = { id: String(mockUsers.length + 1), ...body }
      return c.json({ created: newUser }, 201)
    }
  )
  .get('/users/:id', (c) => {
    const id = c.req.param('id')
    const user = mockUsers.find((u) => u.id === id)

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ userId: id, user })
  })
  .get('/openapi.json', serveOpenAPI({ config, rootPath }))
  .get('/swagger', swaggerUI({ url: '/openapi.json' }))

export type AppType = typeof app
export default app
