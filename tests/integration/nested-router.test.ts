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

describe('nested-router', () => {
  let spec: OpenApiSpec

  beforeAll(async () => {
    spec = await generateFixtureSpec('nested-router')
  })

  test('generates the configured OpenAPI document', () => {
    expectOpenApiDocument(spec, 'Nested Router', 'Nested Router')
  })

  test('flattens routers merged at the root path', () => {
    expectPaths(spec, {
      '/docs': ['get'],
      '/docs/{id}': ['get'],
      '/users': ['get', 'post'],
    })
  })

  test('keeps dynamic path parameters after route merging', () => {
    expectPathParameter(expectOperation(spec, '/docs/{id}', 'get'), 'id')
  })

  test('captures response statuses from nested handlers', () => {
    expectStatusCodes(expectOperation(spec, '/users', 'post'), ['201'])
  })

  test('matches snapshot', () => {
    expect(spec).toMatchSnapshot()
  })
})
