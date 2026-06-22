import { beforeAll, describe, expect, test } from 'vitest'
import {
  expectOpenApiDocument,
  expectOperation,
  expectPathParameter,
  expectPaths,
  generateFixtureSpec,
  OpenApiSpec,
} from './support/openapi'

describe('nested-router-advanced', () => {
  let spec: OpenApiSpec

  beforeAll(async () => {
    spec = await generateFixtureSpec('nested-router-advanced')
  })

  test('generates the configured OpenAPI document', () => {
    expectOpenApiDocument(spec, 'Nested Router Advanced', 'Nested Router Advanced')
  })

  test('preserves routers mounted at different prefixes', () => {
    expectPaths(spec, {
      '/health': ['get'],
      '/api/v1/docs': ['get'],
      '/api/v1/docs/{id}': ['get'],
      '/api/v1/users': ['get', 'post'],
      '/auth/login': ['post'],
      '/auth/logout': ['post'],
    })
  })

  test('keeps path parameters inside prefixed routers', () => {
    expectPathParameter(expectOperation(spec, '/api/v1/docs/{id}', 'get'), 'id')
  })

  test('matches snapshot', () => {
    expect(spec).toMatchSnapshot()
  })
})
