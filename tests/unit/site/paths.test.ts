import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('site paths', () => {
  it('keeps local development links at the root', async () => {
    vi.stubEnv('SITE_BASE_PATH', '')
    const { sitePath } = await import('../../../site/paths')
    expect(sitePath('/docs/api')).toBe('/docs/api')
  })

  it('prefixes Pages links without duplicate slashes', async () => {
    vi.stubEnv('SITE_BASE_PATH', '/hono-docs/')
    const { sitePath } = await import('../../../site/paths')
    expect(sitePath('/')).toBe('/hono-docs/')
    expect(sitePath('/#examples')).toBe('/hono-docs/#examples')
    expect(sitePath('/assets/site.css?v=7')).toBe('/hono-docs/assets/site.css?v=7')
  })
})
