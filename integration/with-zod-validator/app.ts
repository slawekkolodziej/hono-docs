import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createUser, getUser } from './data'
import { CreateUserSchema, SearchQuerySchema, UserParamSchema } from './schemas'

const app = new Hono()
  .get('/search', zValidator('query', SearchQuerySchema), (c) => {
    const query = c.req.valid('query')

    return c.json({ query })
  })
  .get('/users/:id', zValidator('param', UserParamSchema), (c) => {
    const params = c.req.valid('param')

    return c.json({ user: getUser(params.id) })
  })
  .post('/users', zValidator('json', CreateUserSchema), (c) => {
    const body = c.req.valid('json')

    return c.json({ user: createUser(body) }, 201)
  })

export default app
export type AppType = typeof app
