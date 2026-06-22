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

describe('simple-router', () => {
  let spec: OpenApiSpec

  beforeAll(async () => {
    spec = await generateFixtureSpec('simple-router')
  })

  test('generates the configured OpenAPI document', () => {
    expectOpenApiDocument(spec, 'Simple Router Test API', 'Simple Router')
    expect(spec.info.description).toContain('This example uses Zod validator.')
    expect(spec.info.description).toContain('- annotating endpoints with `doc()` middleware')
  })

  test('keeps only application routes and configured exclusions', () => {
    expectPaths(spec, {
      '/api/users': ['get', 'post'],
      '/api/users/{id}': ['delete', 'get', 'put'],
      '/api/profile': ['get'],
    })

    expectNoPaths(spec, ['/docs', '/openapi.json'])
  })

  test('adds path parameters to every operation using the id segment', () => {
    for (const method of ['get', 'put', 'delete'] as const) {
      expectPathParameter(expectOperation(spec, '/api/users/{id}', method), 'id')
    }
  })

  test('captures success and error responses from route branches', () => {
    expectStatusCodes(expectOperation(spec, '/api/users/{id}', 'get'), ['200', '404'])
    expectStatusCodes(expectOperation(spec, '/api/users/{id}', 'put'), ['200', '400', '404'])
    expectStatusCodes(expectOperation(spec, '/api/users/{id}', 'delete'), ['200', '404'])
    expectStatusCodes(expectOperation(spec, '/api/profile', 'get'), ['200', '401'])
  })

  test('captures Zod request body and validation errors', () => {
    const operation = expectOperation(spec, '/api/users', 'post')

    expectJsonRequestBody(operation, ['name', 'email'])
    expectStatusCodes(operation, ['201', '400'])
    expect(operation.responses['400']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            properties: {
              success: { const: false },
              error: {
                properties: {
                  issues: { type: 'array' },
                },
              },
            },
          },
        },
      },
    })
  })

  test('applies doc middleware metadata to documented operations', () => {
    expect(expectOperation(spec, '/api/users', 'get')).toMatchObject({
      summary: 'List users',
      tags: ['Users'],
    })
    expect(expectOperation(spec, '/api/users', 'post')).toMatchObject({
      summary: 'Create user with Zod',
      tags: ['Users', 'Validation'],
    })
    expect(expectOperation(spec, '/api/profile', 'get')).toMatchObject({
      summary: 'Get current profile',
      tags: ['Auth', 'Profile'],
    })
  })

  test('keeps the API group tag on undocumented operations', () => {
    expect(expectOperation(spec, '/api/users/{id}', 'put').tags).toEqual(['Simple Router'])
    expect(expectOperation(spec, '/api/users/{id}', 'delete').tags).toEqual(['Simple Router'])
  })

  test('matches snapshot', () => {
    expect(spec).toMatchSnapshot()
  })
})
