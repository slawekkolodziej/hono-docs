import { describe, expect, test } from 'vitest'
import { renderApiDocs, renderHome } from '../../../site/render'

describe('site home render', () => {
  test('keeps relative indentation inside example code blocks', () => {
    const page = renderHome([], {}) as { toString(): string }
    const html = page.toString()

    expect(html).toContain('\n  .get(<span class="token-string">&quot;/users&quot;</span>')
    expect(html).toContain('\n  url: <span class="token-string">&quot;/openapi.json&quot;</span>')
  })

  test('uses the same hero spacing on home and API pages', async () => {
    const page = (await renderApiDocs()) as { toString(): string }
    const html = page.toString()

    expect(html).toContain('<section class="hero" id="api-overview">')
    expect(html).not.toContain('hero compact')
  })
})
