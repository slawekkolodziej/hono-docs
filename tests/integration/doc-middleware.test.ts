import { beforeAll, describe, expect, test } from 'vitest'
import {
  expectNoPaths,
  expectOpenApiDocument,
  expectOperation,
  expectPathParameter,
  expectPaths,
  generateFixtureSpec,
  OpenApiSpec,
} from './support/openapi'

describe('doc-middleware', () => {
  let spec: OpenApiSpec

  beforeAll(async () => {
    spec = await generateFixtureSpec('doc-middleware')
  })

  test('generates the configured OpenAPI document', () => {
    expectOpenApiDocument(spec, 'Doc Middleware', 'Doc Middleware')
    expect(spec.info.description).toContain(
      'Documentation lives next to each handler through `doc()` middleware.'
    )
    expect(spec.info.description).toContain('- markdown descriptions')
  })

  test('keeps application routes and excludes documentation UI routes', () => {
    expectPaths(spec, {
      '/health': ['get'],
      '/users': ['get', 'post'],
      '/users/{id}': ['get'],
      '/legacy': ['get'],
    })

    expectNoPaths(spec, ['/docs', '/openapi.json', '/open-api'])
  })

  test('applies summaries, descriptions, and tags from doc middleware', () => {
    expect(expectOperation(spec, '/health', 'get')).toMatchObject({
      summary: 'Health check endpoint',
      tags: ['Health', 'Monitoring'],
    })
    expect(expectOperation(spec, '/users', 'get')).toMatchObject({
      summary: 'List all users',
      tags: ['Users'],
    })
    expect(expectOperation(spec, '/users', 'post')).toMatchObject({
      summary: 'Create new user',
      tags: ['Users', 'Admin'],
    })
  })

  test('preserves long markdown descriptions from doc middleware', () => {
    expect(expectOperation(spec, '/users/{id}', 'get').description).toContain(
      'Retrieve detailed information'
    )
    expect(expectOperation(spec, '/health', 'get').description).toContain(
      'markdown supplied by doc()'
    )
  })

  test('marks deprecated operations from doc middleware', () => {
    expect(expectOperation(spec, '/legacy', 'get')).toMatchObject({
      deprecated: true,
      tags: ['Legacy'],
    })
  })

  test('adds parameters for documented dynamic routes', () => {
    expectPathParameter(expectOperation(spec, '/users/{id}', 'get'), 'id')
  })

  test('matches snapshot', () => {
    expect(spec).toMatchSnapshot()
  })
})
