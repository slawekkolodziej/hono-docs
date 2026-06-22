import { beforeAll, describe, expect, test } from 'vitest'
import {
  expectOpenApiDocument,
  expectOperation,
  expectPaths,
  expectStatusCodes,
  generateFixtureSpec,
  OpenApiSpec,
} from './support/openapi'

describe('middleware-response', () => {
  let spec: OpenApiSpec

  beforeAll(async () => {
    spec = await generateFixtureSpec('middleware-response')
  })

  test('generates the configured OpenAPI document', () => {
    expectOpenApiDocument(spec, 'Middleware Response', 'Middleware Response')
    expect(spec.info.description).toContain('Not supported yet')
  })

  test('documents the route with a middleware response gap', () => {
    expectPaths(spec, {
      '/docs': ['get'],
    })

    const operation = expectOperation(spec, '/docs', 'get')

    expect(operation.description).toContain('Not supported yet')
    expectStatusCodes(operation, ['200'])
    expect(operation.responses).not.toHaveProperty('500')
  })

  test('matches snapshot', () => {
    expect(spec).toMatchSnapshot()
  })
})
