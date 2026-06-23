import { beforeAll, describe, expect, test } from 'vitest'
import {
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
    expectOpenApiDocument(spec, 'Simple Router', 'Simple Router')
    expect(spec.info.description).toContain('- static JSON responses')
    expect(spec.info.description).toContain('- path parameter inference')
  })

  test('keeps the route list intentionally small', () => {
    expectPaths(spec, {
      '/users': ['get'],
      '/users/{id}': ['get'],
      '/users/{id}/profile': ['get'],
      '/health': ['get'],
    })
  })

  test('adds path parameters to dynamic routes', () => {
    expectPathParameter(expectOperation(spec, '/users/{id}', 'get'), 'id')
    expectPathParameter(expectOperation(spec, '/users/{id}/profile', 'get'), 'id')
  })

  test('captures success and not-found response branches', () => {
    expectStatusCodes(expectOperation(spec, '/users/{id}', 'get'), ['200', '404'])
  })

  test('captures redirect response branches', () => {
    expectStatusCodes(expectOperation(spec, '/users/{id}/profile', 'get'), ['302'])
  })

  test('applies doc middleware metadata to documented operations', () => {
    expect(expectOperation(spec, '/users', 'get')).toMatchObject({
      summary: 'List users',
      tags: ['Users'],
    })
    expect(expectOperation(spec, '/users/{id}', 'get')).toMatchObject({
      summary: 'Get user',
      tags: ['Users'],
    })
  })

  test('keeps the API group tag on undocumented operations', () => {
    expect(expectOperation(spec, '/health', 'get').tags).toEqual(['Simple Router'])
  })

  test('matches snapshot', () => {
    expect(spec).toMatchSnapshot()
  })
})
