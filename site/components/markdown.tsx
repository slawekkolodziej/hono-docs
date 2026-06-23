import { escapeHtml, renderInlineMarkdown, slugify } from './text'

export function AnchorHeading({
  level,
  id,
  children,
}: {
  level: 2 | 3
  id: string
  children: string
}) {
  const Heading = `h${level}` as 'h2' | 'h3'

  return (
    <Heading id={id} class='anchor-heading'>
      <a href={`#${id}`} aria-label={`Link to ${children}`}>
        {children}
      </a>
    </Heading>
  )
}

function renderMarkdown(value: string): string {
  const lines = value.trim().split('\n')
  const html: string[] = []
  const paragraph: string[] = []
  let listOpen = false

  const flushParagraph = () => {
    if (!paragraph.length) {
      return
    }

    html.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`)
    paragraph.length = 0
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()

      if (listOpen) {
        html.push('</ul>')
        listOpen = false
      }
      continue
    }

    const listItem = trimmed.match(/^-\s+(.+)$/)

    if (listItem) {
      flushParagraph()

      if (!listOpen) {
        html.push('<ul>')
        listOpen = true
      }

      html.push(`<li>${renderInlineMarkdown(listItem[1])}</li>`)
      continue
    }

    if (listOpen) {
      html.push('</ul>')
      listOpen = false
    }

    const heading = trimmed.match(/^(#{2,3})\s+(.+)$/)

    if (heading) {
      flushParagraph()

      const level = heading[1].length + 1
      const id = slugify(heading[2])
      html.push(
        `<h${level} id="${id}" class="anchor-heading"><a href="#${id}" aria-label="Link to ${escapeHtml(
          heading[2]
        )}">${renderInlineMarkdown(heading[2])}</a></h${level}>`
      )
      continue
    }

    paragraph.push(trimmed)
  }

  flushParagraph()

  if (listOpen) {
    html.push('</ul>')
  }

  return html.join('')
}

export function Markdown({ children }: { children: string }) {
  return <div class='markdown' dangerouslySetInnerHTML={{ __html: renderMarkdown(children) }} />
}
