import { z } from 'zod'

export const UserSearchQuerySchema = z.object({
  q: z.string().min(1).optional(),
  role: z.enum(['admin', 'member', 'viewer']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const UserParamSchema = z.object({
  userId: z.string().uuid(),
})

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'member', 'viewer']),
})

export const ProjectSearchQuerySchema = z.object({
  status: z.enum(['active', 'paused', 'archived']).optional(),
  ownerId: z.string().uuid().optional(),
})

export const ProjectParamSchema = z.object({
  projectId: z.string().uuid(),
})

export const CreateProjectSchema = z.object({
  name: z.string().min(2),
  ownerId: z.string().uuid(),
  budgetCents: z.number().int().min(0),
})

export const UpdateProjectStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'archived']),
  reason: z.string().min(3).optional(),
})

export const ReportQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  projectId: z.string().uuid().optional(),
})

export const ExportRequestSchema = z.object({
  format: z.enum(['csv', 'json']),
  emailTo: z.string().email(),
  filters: ReportQuerySchema,
})

export type CreateUser = z.infer<typeof CreateUserSchema>
export type CreateProject = z.infer<typeof CreateProjectSchema>
export type ProjectStatus = z.infer<
  typeof UpdateProjectStatusSchema
>['status']
export type ExportRequest = z.infer<typeof ExportRequestSchema>
