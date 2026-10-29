import { isStaticSite, sitePath } from '../paths'
import type { Child } from 'hono/jsx'

export function Layout({ title, children }: { title: string; children: Child }) {
  return (
    <html lang='en'>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <title>{title}</title>
        <meta name='description' content='Generate OpenAPI from Hono route types.' />
        <link
          rel='icon'
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230f172a'/%3E%3Cpath d='M9 10h14M9 16h10M9 22h14' stroke='white' stroke-width='2.4' stroke-linecap='round'/%3E%3C/svg%3E"
        />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossorigin='' />
        <link
          href='https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap'
          rel='stylesheet'
        />
        <link rel='stylesheet' href={sitePath('/assets/site.css?v=7')} />
      </head>
      <body>
        <header class='topbar'>
          <a class='brand' href={sitePath('/')}>
            hono-docs
          </a>
          <nav aria-label='Primary'>
            <a href={sitePath('/#install')}>Install</a>
            <a href={sitePath('/#examples')}>Examples</a>
            <a href={sitePath('/docs/api')}>API docs</a>
          </nav>
        </header>
        {isStaticSite && (
          <p style='text-align: center; padding: 1rem'>
            These examples are read-only. Run the project locally to try API requests.
          </p>
        )}
        {children}
      </body>
    </html>
  )
}
