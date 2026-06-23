import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const siteDir = path.join(process.cwd(), 'site')

describe('site render structure', () => {
  test('keeps reusable JSX components outside the page renderer', () => {
    const renderSource = fs.readFileSync(path.join(siteDir, 'render.tsx'), 'utf-8')

    expect(fs.existsSync(path.join(siteDir, 'components', 'layout.tsx'))).toBe(true)
    expect(fs.existsSync(path.join(siteDir, 'components', 'code-block.tsx'))).toBe(true)
    expect(fs.existsSync(path.join(siteDir, 'components', 'markdown.tsx'))).toBe(true)
    expect(renderSource).not.toMatch(/function (Layout|CodeBlock|Markdown|Icon)\(/)
  })

  test('keeps multiline CSS readable with dedent', () => {
    const stylesSource = fs.readFileSync(path.join(siteDir, 'styles.ts'), 'utf-8')

    expect(stylesSource).toContain("import dedent from 'dedent'")
    expect(stylesSource).toContain('dedent`')
    expect(stylesSource).not.toContain('String.raw`')
  })
})
