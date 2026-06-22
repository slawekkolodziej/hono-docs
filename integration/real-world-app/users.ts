import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { doc } from 'hono-docs'
import {
  createUser,
  getUser,
  listUsers,
} from './data'
import {
  CreateUserSchema,
  UserParamSchema,
  UserSearchQuerySchema,
} from './schemas'

export const usersRouter = new Hono()
  .get(
    '/',
    zValidator('query', UserSearchQuerySchema),
    doc({
      summary: 'Search users',
      description: `
        Returns users visible to the authenticated
        workspace member.
      `,
      tags: ['Users'],
    }),
    (c) => {
      const query = c.req.valid('query')

      return c.json({ users: listUsers(query) })
    }
  )
  .get(
    '/:userId',
    zValidator('param', UserParamSchema),
    doc({
      summary: 'Get user profile',
      description: `
        Loads a single user profile by UUID.
      `,
      tags: ['Users'],
    }),
    (c) => {
      const { userId } = c.req.valid('param')

      return c.json({ user: getUser(userId) })
    }
  )
  .post(
    '/',
    zValidator('json', CreateUserSchema),
    doc({
      summary: 'Create user',
      description: `
        Creates a workspace user after the request
        body passes JSON validation.
      `,
      tags: ['Users', 'Admin'],
    }),
    (c) => {
      const body = c.req.valid('json')

      return c.json({ user: createUser(body) }, 201)
    }
  )
