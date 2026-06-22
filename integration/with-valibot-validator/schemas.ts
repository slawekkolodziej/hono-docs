import * as v from 'valibot'

export const SearchQuerySchema = v.object({
  q: v.pipe(v.string(), v.minLength(1)),
  limit: v.optional(v.pipe(v.string(), v.regex(/^\d+$/)), '10'),
})

export const UserParamSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
})

export const CreateUserSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  email: v.pipe(v.string(), v.email()),
})

export type CreateUser = v.InferOutput<typeof CreateUserSchema>
