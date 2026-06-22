import type {
  CreateProject,
  CreateUser,
  ExportRequest,
  ProjectStatus,
} from './schemas'

const users = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    role: 'admin',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'grace@example.com',
    name: 'Grace Hopper',
    role: 'member',
  },
]

const projects = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Billing dashboard',
    ownerId: users[0].id,
    status: 'active',
    budgetCents: 125000,
  },
]

export function listUsers(filters: {
  q?: string
  role?: string
  limit: number
}) {
  return users
    .filter((user) => !filters.role || user.role === filters.role)
    .filter((user) => {
      if (!filters.q) return true

      return user.name
        .toLowerCase()
        .includes(filters.q.toLowerCase())
    })
    .slice(0, filters.limit)
}

export function getUser(userId: string) {
  return users.find((user) => user.id === userId) ?? users[0]
}

export function createUser(input: CreateUser) {
  return {
    id: '00000000-0000-4000-8000-000000000003',
    ...input,
  }
}

export function listProjects(filters: {
  status?: string
  ownerId?: string
}) {
  return projects
    .filter((project) => {
      return !filters.status || project.status === filters.status
    })
    .filter((project) => {
      return !filters.ownerId || project.ownerId === filters.ownerId
    })
}

export function createProject(input: CreateProject) {
  return {
    id: '10000000-0000-4000-8000-000000000002',
    status: 'active',
    ...input,
  }
}

export function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
) {
  return {
    project: {
      ...(projects.find((project) => project.id === projectId) ??
        projects[0]),
      status,
    },
  }
}

export function monthlyReport(filters: {
  month: string
  projectId?: string
}) {
  return {
    month: filters.month,
    projectId: filters.projectId,
    revenueCents: 840000,
    activeUsers: 42,
  }
}

export function queueExport(input: ExportRequest) {
  return {
    exportId: '20000000-0000-4000-8000-000000000001',
    status: 'queued',
    ...input,
  }
}
