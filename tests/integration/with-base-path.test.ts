import { beforeAll, describe, expect, test } from 'vitest'
import {
  expectOpenApiDocument,
  expectOperation,
  expectPathParameter,
  expectPaths,
  generateFixtureSpec,
  OpenApiSpec,
} from './support/openapi'

describe('with-base-path', () => {
  let spec: OpenApiSpec

  beforeAll(async () => {
    spec = await generateFixtureSpec('with-base-path')
  })

  test('generates the configured OpenAPI document', () => {
    expectOpenApiDocument(spec, 'With Base Path', 'With Base Path')
  })

  test('prefixes every route with basePath', () => {
    expectPaths(spec, {
      '/v1/status': ['get'],
      '/v1/users/{id}': ['get'],
    })
  })

  test('keeps path parameters after basePath', () => {
    expectPathParameter(expectOperation(spec, '/v1/users/{id}', 'get'), 'id')
  })

  test('matches snapshot', () => {
    expect(spec).toMatchSnapshot()
  })
})
