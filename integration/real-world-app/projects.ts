import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { doc } from 'hono-docs'
import {
  createProject,
  listProjects,
  updateProjectStatus,
} from './data'
import {
  CreateProjectSchema,
  ProjectParamSchema,
  ProjectSearchQuerySchema,
  UpdateProjectStatusSchema,
} from './schemas'

export const projectsRouter = new Hono()
  .get(
    '/',
    zValidator('query', ProjectSearchQuerySchema),
    doc({
      summary: 'List projects',
      description: `
        Lists projects for the authenticated
        workspace, with common dashboard filters.
      `,
      tags: ['Projects'],
    }),
    (c) => {
      const query = c.req.valid('query')

      return c.json({ projects: listProjects(query) })
    }
  )
  .post(
    '/',
    zValidator('json', CreateProjectSchema),
    doc({
      summary: 'Create project',
      description: `
        Creates a project owned by an existing
        workspace user.
      `,
      tags: ['Projects'],
    }),
    (c) => {
      const body = c.req.valid('json')

      return c.json({ project: createProject(body) }, 201)
    }
  )
  .patch(
    '/:projectId/status',
    zValidator('param', ProjectParamSchema),
    zValidator('json', UpdateProjectStatusSchema),
    doc({
      summary: 'Update project status',
      description: `
        Updates lifecycle state through a protected
        admin workflow.
      `,
      tags: ['Projects', 'Admin'],
    }),
    (c) => {
      const { projectId } = c.req.valid('param')
      const { status } = c.req.valid('json')

      return c.json(updateProjectStatus(projectId, status))
    }
  )
