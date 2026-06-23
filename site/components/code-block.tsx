import { escapeHtml } from './text'

export function highlightTypeScript(value: string): string {
  return value
    .split('\n')
    .map((line) =>
      line.replace(
        /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/.*|\b(?:any|async|boolean|const|default|export|from|import|new|number|Promise|return|string|type|void)\b|\b\d+\b)/g,
        (token) => {
          const escaped = escapeHtml(token)

          if (token.startsWith('//')) {
            return `<span class="token-comment">${escaped}</span>`
          }

          if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
            return `<span class="token-string">${escaped}</span>`
          }

          if (/^\d+$/.test(token)) {
            return `<span class="token-number">${escaped}</span>`
          }

          return `<span class="token-keyword">${escaped}</span>`
        }
      )
    )
    .join('\n')
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre>
      <code dangerouslySetInnerHTML={{ __html: highlightTypeScript(children.trim()) }} />
    </pre>
  )
}
