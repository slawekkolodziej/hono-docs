import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { doc } from 'hono-docs'

const sometimesFails: MiddlewareHandler = async (
  c,
  next
) => {
  if (c.req.header('x-fail') === 'true') {
    return c.json(
      { error: 'Middleware failed' },
      500
    )
  }

  await next()
}

const app = new Hono().get(
  '/docs',
  sometimesFails,
  doc({
    summary: 'Middleware response gap',
    description: `
      This route uses middleware that can return a
      500 response.

      Not supported yet: Hono route types do not
      currently expose middleware responses to the
      schema used by hono-docs, so the generated
      OpenAPI document only includes the handler
      response.
    `,
    tags: ['Middleware Response'],
  }),
  (c) =>
    c.json({
      docs: [{ id: 'intro', title: 'Intro' }],
    })
)

export default app
export type AppType = typeof app
