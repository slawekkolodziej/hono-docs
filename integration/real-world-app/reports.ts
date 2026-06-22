import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { doc } from 'hono-docs'
import {
  monthlyReport,
  queueExport,
} from './data'
import {
  ExportRequestSchema,
  ReportQuerySchema,
} from './schemas'

export const reportsRouter = new Hono()
  .get(
    '/monthly',
    zValidator('query', ReportQuerySchema),
    doc({
      summary: 'Get monthly report',
      description: `
        Reads a reporting view with query
        validation and authorization middleware.
      `,
      tags: ['Reports'],
    }),
    (c) => {
      const query = c.req.valid('query')

      return c.json({ report: monthlyReport(query) })
    }
  )
  .post(
    '/exports',
    zValidator('json', ExportRequestSchema),
    doc({
      summary: 'Queue report export',
      description: `
        Starts an asynchronous export job for the
        selected reporting filters.
      `,
      tags: ['Reports'],
    }),
    (c) => {
      const body = c.req.valid('json')

      return c.json({ export: queueExport(body) }, 202)
    }
  )
