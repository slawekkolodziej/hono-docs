import { describe, expect, test } from 'vitest'
import { renderApiDocs } from '../../../site/render'

describe('site API reference', () => {
  test('renders generated public API sections from exported TypeScript symbols', async () => {
    const html = (await renderApiDocs()).toString()

    expect(html).toContain('Generated from TSDoc')
    expect(html).toContain('serveOpenAPI')
    expect(html).toContain('defineConfig')
    expect(html).toContain('HonoDocsConfig')
    expect(html).toContain('Auto-detect hono-docs config file')
  })

  test('renders navigable and grouped API docs with highlighted signatures', async () => {
    const html = (await renderApiDocs()).toString()

    expect(html).toContain('class="sidebar"')
    expect(html).toContain('Runtime middlewares')
    expect(html).toContain('class="api-kind function"')
    expect(html).toContain('class="api-kind type"')
    expect(html).toContain('id="functions-runtime-middlewares"')
    expect(html).toContain('id="types-runtime-middlewares"')
    expect(html).toContain('token-keyword')
    expect(html).toContain('generateOpenAPI')
    expect(html).not.toContain('runGenerate(configPath')
    expect(html).not.toContain('createTypedMiddleware')
  })

  test('orders API navigation by reference sections and places CLI last', async () => {
    const html = (await renderApiDocs()).toString()
    const sidebar = html.slice(html.indexOf('<aside class="sidebar"'), html.indexOf('</aside>'))

    expect(sidebar).not.toContain('href="#api-overview"')
    expect(sidebar.indexOf('href="#runtime-middlewares"')).toBeLessThan(
      sidebar.indexOf('href="#generation-config"')
    )
    expect(sidebar.indexOf('href="#generation-config"')).toBeLessThan(
      sidebar.indexOf('href="#cli"')
    )
  })
})
