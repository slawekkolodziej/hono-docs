import { beforeAll, describe, expect, test } from 'vitest'
import {
  expectJsonRequestBody,
  expectOpenApiDocument,
  expectOperation,
  expectPathParameter,
  expectPaths,
  expectStatusCodes,
  generateFixtureSpec,
  OpenApiSpec,
} from './support/openapi'

describe('with-valibot-validator', () => {
  let spec: OpenApiSpec

  beforeAll(async () => {
    spec = await generateFixtureSpec('with-valibot-validator')
  })

  test('generates the configured OpenAPI document', () => {
    expectOpenApiDocument(spec, 'With Valibot Validator', 'With Valibot Validator')
    expect(spec.info.description).toContain('`@hono/valibot-validator`')
  })

  test('documents routes using json, query, and param validators', () => {
    expectPaths(spec, {
      '/search': ['get'],
      '/users/{id}': ['get'],
      '/users': ['post'],
    })
  })

  test('captures query parameters from Valibot', () => {
    const operation = expectOperation(spec, '/search', 'get')

    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'q', in: 'query', required: true }),
        expect.objectContaining({ name: 'limit', in: 'query', required: false }),
      ])
    )
    expectStatusCodes(operation, ['200', '400'])
  })

  test('captures path parameters from Valibot', () => {
    const operation = expectOperation(spec, '/users/{id}', 'get')

    expectPathParameter(operation, 'id')
    expectStatusCodes(operation, ['200', '400'])
  })

  test('captures JSON body and validator error responses from Valibot', () => {
    const operation = expectOperation(spec, '/users', 'post')

    expectJsonRequestBody(operation, ['name', 'email'])
    expectStatusCodes(operation, ['201', '400'])
  })

  test('matches snapshot', () => {
    expect(spec).toMatchSnapshot()
  })
})
