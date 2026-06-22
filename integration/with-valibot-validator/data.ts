import type { CreateUser } from './schemas'

export const users = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Grace Hopper',
    email: 'grace@example.com',
  },
]

export function getUser(id: string) {
  return users.find((user) => user.id === id) ?? users[0]
}

export function createUser(body: CreateUser) {
  return {
    id: '00000000-0000-4000-8000-000000000002',
    ...body,
  }
}
