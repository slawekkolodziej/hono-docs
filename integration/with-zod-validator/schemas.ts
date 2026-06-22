import { z } from 'zod'

export const SearchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export const UserParamSchema = z.object({
  id: z.string().uuid(),
})

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export type CreateUser = z.infer<typeof CreateUserSchema>
