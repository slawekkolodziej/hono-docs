export const userListResponse = { users: [], total: 0 }

export function userDetailResponse(id: string) {
  return {
    id,
    name: 'John Doe',
    email: 'john@example.com',
  }
}

export const createdUserResponse = { id: '123', message: 'User created' }
export const legacyResponse = { message: 'This endpoint is deprecated' }
