import { beforeAll, describe, expect, test } from 'vitest'
import {
  expectJsonRequestBody,
  expectNoPaths,
  expectOpenApiDocument,
  expectOperation,
  expectPathParameter,
  expectPaths,
  expectStatusCodes,
  generateFixtureSpec,
  OpenApiSpec,
} from './support/openapi'

describe('real-world-app', () => {
  let spec: OpenApiSpec

  beforeAll(async () => {
    spec = await generateFixtureSpec('real-world-app')
  })

  test('generates the configured OpenAPI document', () => {
    expectOpenApiDocument(spec, 'Real World App', 'Real World App')
    expect(spec.info.description).toContain('authentication')
    expect(spec.info.description).toContain('multiple route modules')
  })

  test('documents protected API modules and public health', () => {
    expectPaths(spec, {
      '/health': ['get'],
      '/api/users': ['get', 'post'],
      '/api/users/{userId}': ['get'],
      '/api/projects': ['get', 'post'],
      '/api/projects/{projectId}/status': ['patch'],
      '/api/reports/monthly': ['get'],
      '/api/reports/exports': ['post'],
    })

    expectNoPaths(spec, ['/docs', '/openapi.json'])
  })

  test('applies route metadata from config and entrypoint docs', () => {
    expect(expectOperation(spec, '/health', 'get')).toMatchObject({
      summary: 'Health check',
      tags: ['System'],
    })

    expect(expectOperation(spec, '/api/users', 'get')).toMatchObject({
      summary: 'Search users',
      tags: ['Users'],
    })
    expect(expectOperation(spec, '/api/projects/{projectId}/status', 'patch')).toMatchObject({
      summary: 'Update project status',
      tags: ['Projects', 'Admin'],
    })
    expect(expectOperation(spec, '/api/reports/exports', 'post')).toMatchObject({
      summary: 'Queue report export',
      tags: ['Reports'],
    })
  })

  test('captures query, path, and body validation', () => {
    const searchUsers = expectOperation(spec, '/api/users', 'get')
    expect(searchUsers.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'q', in: 'query' }),
        expect.objectContaining({ name: 'role', in: 'query' }),
        expect.objectContaining({ name: 'limit', in: 'query' }),
      ])
    )
    expectStatusCodes(searchUsers, ['200', '400'])

    const getUser = expectOperation(spec, '/api/users/{userId}', 'get')
    expectPathParameter(getUser, 'userId')
    expectStatusCodes(getUser, ['200', '400'])

    const createProject = expectOperation(spec, '/api/projects', 'post')
    expectJsonRequestBody(createProject, ['name', 'ownerId', 'budgetCents'])
    expectStatusCodes(createProject, ['201', '400'])
  })

  test('captures routes with multiple validators', () => {
    const updateStatus = expectOperation(
      spec,
      '/api/projects/{projectId}/status',
      'patch'
    )

    expectPathParameter(updateStatus, 'projectId')
    expectJsonRequestBody(updateStatus, ['status'])
    expectStatusCodes(updateStatus, ['200', '400'])
  })

  test('matches snapshot', () => {
    expect(spec).toMatchSnapshot()
  })
})
