import { Example, openApiPath, scalarPath, swaggerPath } from './examples'
import { getApiReference } from './api-reference'
import type { ApiReferenceMember, ApiReferenceSection } from './api-reference'
import type { Child } from 'hono/jsx'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightTypeScript(value: string): string {
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

function CodeBlock({ children }: { children: string }) {
  return (
    <pre>
      <code dangerouslySetInnerHTML={{ __html: highlightTypeScript(children.trim()) }} />
    </pre>
  )
}

function renderInlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
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
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`)
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

function Markdown({ children }: { children: string }) {
  return <div class='markdown' dangerouslySetInnerHTML={{ __html: renderMarkdown(children) }} />
}

function PageNav({ examples }: { examples: Example[] }) {
  const groups = [
    {
      label: 'Start',
      links: [
        ['Overview', '#get-started'],
        ['Install', '#install'],
        ['OpenAPI JSON', '#openapi-json'],
        ['OpenAPI UI', '#existing-ui'],
      ],
    },
    {
      label: 'Config',
      links: [
        ['Configuration', '#config'],
        ['doc() middleware', '#doc-middleware'],
      ],
    },
    {
      label: 'Examples',
      links: [
        ['All examples', '#examples'],
        ...examples.map((example) => [example.name, `#example-${example.slug}`]),
      ],
    },
  ]

  return (
    <>
      {groups.map((group) => (
        <div class='nav-group'>
          <div class='nav-group-label'>{group.label}</div>
          {group.links.map(([label, href]) => (
            <a href={href}>{label}</a>
          ))}
        </div>
      ))}
    </>
  )
}

function Icon({ name }: { name: 'swagger' | 'scalar' | 'json' | 'api' | 'function' | 'type' }) {
  return (
    <svg
      class='icon'
      viewBox='0 0 24 24'
      aria-hidden='true'
      fill='none'
      stroke='currentColor'
      stroke-width='1.8'
      stroke-linecap='round'
      stroke-linejoin='round'
    >
      {name === 'swagger' && (
        <>
          <path d='M5 5h14v14H5z' />
          <path d='M9 9h6M9 13h6M9 17h3' />
        </>
      )}
      {name === 'scalar' && (
        <>
          <path d='M4 7h16M4 12h16M4 17h16' />
          <path d='M8 4v16M16 4v16' />
        </>
      )}
      {name === 'json' && (
        <>
          <path d='M8 8 5 12l3 4M16 8l3 4-3 4' />
          <path d='m14 6-4 12' />
        </>
      )}
      {name === 'api' && (
        <>
          <path d='M6 8h12M6 12h12M6 16h7' />
          <path d='M4 4h16v16H4z' />
        </>
      )}
      {name === 'function' && (
        <>
          <path d='M8 19c2.2-4.4 2.8-10.6 4-14' />
          <path d='M6 10h8' />
          <path d='M14 15c.8-1 1.7-1 2.5 0l1 1.2c.8 1 1.7 1 2.5-.2' />
        </>
      )}
      {name === 'type' && (
        <>
          <path d='M4 6h16' />
          <path d='M8 6v12' />
          <path d='M14 18h6' />
          <path d='M17 10v8' />
        </>
      )}
    </svg>
  )
}

function Layout({ title, children }: { title: string; children: Child }) {
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
        <link rel='stylesheet' href='/assets/site.css?v=5' />
      </head>
      <body>
        <header class='topbar'>
          <a class='brand' href='/'>
            hono-docs
          </a>
          <nav aria-label='Primary'>
            <a href='/#install'>Install</a>
            <a href='/#examples'>Examples</a>
            <a href='/docs/api'>API docs</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}

function ExampleRows({
  examples,
  appSources,
}: {
  examples: Example[]
  appSources: Record<string, string>
}) {
  return (
    <>
      {examples.map((example) => (
        <article class='example-row' id={`example-${example.slug}`}>
          <div class='example-copy'>
            <h3>{example.name}</h3>
            <Markdown>{example.description}</Markdown>
            <div class='links example-links'>
              <a href={swaggerPath(example)}>
                <Icon name='swagger' /> Open Swagger
              </a>
              <a href={scalarPath(example)}>
                <Icon name='scalar' /> Open Scalar
              </a>
              <a href={openApiPath(example)}>
                <Icon name='json' /> openapi.json
              </a>
            </div>
          </div>
          <div class='example-source'>
            <div class='source-heading'>
              <Icon name='api' /> app.ts
            </div>
            <CodeBlock>
              {appSources[example.slug] ?? 'Unable to load integration app source.'}
            </CodeBlock>
          </div>
        </article>
      ))}
    </>
  )
}

export function renderHome(examples: Example[], appSources: Record<string, string>) {
  return (
    <Layout title='hono-docs'>
      <main class='page'>
        <aside class='sidebar' aria-label='On this page'>
          <PageNav examples={examples} />
        </aside>
        <div class='content'>
          <section class='hero'>
            <p class='eyebrow'>OpenAPI for Hono</p>
            <h1>Generate OpenAPI from Hono route types.</h1>
            <p class='lead'>
              hono-docs reads your typed Hono app and emits an OpenAPI document. Use the JSON with
              Scalar, Swagger UI, or any OpenAPI client tooling.
            </p>
            <div class='actions'>
              <a class='button' href='#get-started'>
                Get started
              </a>
              <a class='button secondary' href='#examples'>
                Browse examples
              </a>
            </div>
          </section>

          <section class='section' id='get-started'>
            <div class='section-intro'>
              <h2>Getting started</h2>
              <p>
                Add the package, expose <code>openapi.json</code>, then point any OpenAPI UI at that
                JSON endpoint.
              </p>
            </div>

            <article class='setup-step' id='install'>
              <h3>Install</h3>
              <p>Add the npm modules used by the generator and optional UI middleware.</p>
              <CodeBlock>pnpm add hono-docs @scalar/hono-api-reference @hono/swagger-ui</CodeBlock>
            </article>

            <article class='setup-step' id='openapi-json'>
              <h3>Expose OpenAPI JSON from Hono</h3>
              <p>
                Add the OpenAPI middleware to your app. The generated document is based on the
                exported <code>AppType</code>.
              </p>
              <CodeBlock>{`
import { Hono } from "hono";
import { serveOpenAPI } from "hono-docs";

const app = new Hono()
  .get("/users", (c) => c.json({ users: [] }))
  .get("/users/:id", (c) => c.json({ id: c.req.param("id") }))
  .get("/openapi.json", serveOpenAPI());

export type AppType = typeof app;
export default app;
              `}</CodeBlock>
            </article>

            <article class='setup-step' id='existing-ui'>
              <h3>Use existing OpenAPI UI middleware</h3>
              <p>
                hono-docs only needs to expose <code>openapi.json</code>. Existing Hono middleware
                such as Scalar and Swagger UI can read that endpoint without any custom adapter.
              </p>
              <div class='code-grid'>
                <CodeBlock>{`
import { Scalar } from "@scalar/hono-api-reference";

app.get("/docs", Scalar({
  url: "/openapi.json",
}));
                `}</CodeBlock>
                <CodeBlock>{`
import { swaggerUI } from "@hono/swagger-ui";

app.get("/swagger", swaggerUI({
  url: "/openapi.json",
}));
                `}</CodeBlock>
              </div>
            </article>
          </section>

          <section class='section' id='config'>
            <h2>Configuration</h2>
            <p>
              Configure the generator with the TypeScript project, exported app type, output target,
              OpenAPI metadata, and explicit exclusions for routes that should not appear in the
              generated document.
            </p>
            <CodeBlock>{`
import { defineConfig } from "hono-docs";

export default defineConfig({
  tsConfigPath: "./tsconfig.json",
  name: "Public API",
  appTypePath: "./app.ts",
  outputs: {
    openApiJson: "./openapi.json",
  },
  openApi: {
    openapi: "3.0.0",
    info: {
      title: "Public API",
      version: "1.0.0",
    },
  },
});
            `}</CodeBlock>
          </section>

          <section class='section' id='doc-middleware'>
            <h2>doc() middleware</h2>
            <p>
              <code>doc()</code> is a no-op Hono middleware. It does not change request handling,
              response handling, validation, or runtime behavior. hono-docs reads it at generation
              time to add OpenAPI operation metadata next to the route that owns it.
            </p>
            <CodeBlock>{`
import { doc } from "hono-docs";

app.get(
  "/users/:id",
  doc({
    summary: "Get user",
    description: \`
      Adds OpenAPI metadata only.

      The handler still controls the runtime response.
    \`,
    tags: ["Users"],
  }),
  (c) => c.json({ id: c.req.param("id") })
);
            `}</CodeBlock>
          </section>

          <section class='section' id='examples'>
            <div class='section-heading'>
              <h2>Integration apps</h2>
              <p>
                Real Hono apps mounted under <code>/integration/:name</code>, with generated JSON
                and ready-to-open Scalar and Swagger views.
              </p>
            </div>
            <div class='example-list'>
              <ExampleRows examples={examples} appSources={appSources} />
            </div>
          </section>
        </div>
      </main>
      <footer>
        <span>hono-docs</span>
        <span>OpenAPI from Hono types</span>
      </footer>
    </Layout>
  )
}

export async function renderApiDocs() {
  const sections = await getApiReference()

  return (
    <Layout title='hono-docs API - hono-docs'>
      <main class='page'>
        <aside class='sidebar' aria-label='API navigation'>
          <ApiPageNav sections={sections} />
        </aside>
        <div class='content'>
          <section class='hero compact' id='api-overview'>
            <p class='eyebrow'>API reference</p>
            <h1>hono-docs public API.</h1>
            <p class='lead'>
              Generated from TSDoc comments on the exported TypeScript surface. OpenAPI generation
              remains focused on your Hono routes; this page documents the library API you call.
            </p>
          </section>

          <ApiReference sections={sections} />

          <section class='section' id='cli'>
            <h2>CLI</h2>
            <CodeBlock>{`
pnpm hono-docs generate --config hono-docs.config.ts
pnpm hono-docs generate --config hono-docs.config.ts --rebuild
            `}</CodeBlock>
          </section>
        </div>
      </main>
    </Layout>
  )
}

function ApiPageNav({ sections }: { sections: ApiReferenceSection[] }) {
  const groups = [
    ...sections.map((section) => {
      const sectionSlug = slugify(section.title)
      const links = [[section.title, `#${sectionSlug}`]]

      if (section.functions.length > 0) {
        links.push(['Functions', `#functions-${sectionSlug}`])
      }

      if (section.types.length > 0) {
        links.push(['Types', `#types-${sectionSlug}`])
      }

      return {
        label: section.title,
        links,
      }
    }),
    {
      label: 'Tools',
      links: [['CLI', '#cli']],
    },
  ]

  return (
    <>
      {groups.map((group) => (
        <div class='nav-group'>
          <div class='nav-group-label'>{group.label}</div>
          {group.links.map(([label, href]) => (
            <a href={href}>{label}</a>
          ))}
        </div>
      ))}
    </>
  )
}

function ApiReference({ sections }: { sections: ApiReferenceSection[] }) {
  return (
    <>
      {sections.map((section) => {
        const sectionSlug = slugify(section.title)

        return (
          <section class='section api-reference' id={sectionSlug}>
            <div class='section-intro'>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>
            {section.functions.length > 0 && (
              <ApiReferenceGroup
                id={`functions-${sectionSlug}`}
                title='Functions'
                items={section.functions}
              />
            )}
            {section.types.length > 0 && (
              <ApiReferenceGroup id={`types-${sectionSlug}`} title='Types' items={section.types} />
            )}
          </section>
        )
      })}
    </>
  )
}

function ApiReferenceGroup({
  id,
  title,
  items,
}: {
  id: string
  title: string
  items: ApiReferenceMember[]
}) {
  return (
    <div class='api-reference-group' id={id}>
      <div class='api-reference-group-heading'>
        <h3>{title}</h3>
      </div>
      <div class='api-reference-list'>
        {items.map((item) => (
          <ApiReferenceItem item={item} />
        ))}
      </div>
    </div>
  )
}

function ApiReferenceItem({ item }: { item: ApiReferenceMember }) {
  return (
    <article class={`api-reference-item ${item.kind}`}>
      <div class='api-reference-heading'>
        <div>
          <h3>{item.name}</h3>
          <span class={`api-kind ${item.kind}`}>
            <Icon name={item.kind} />
            {item.kind === 'function' ? 'Function' : 'Type'}
          </span>
        </div>
      </div>
      {item.signature && (
        <pre class='signature'>
          <code dangerouslySetInnerHTML={{ __html: highlightTypeScript(item.signature) }} />
        </pre>
      )}
      {item.summary && <p>{item.summary}</p>}
      {item.members && item.members.length > 0 && (
        <div class='api-member-list'>
          {item.members.map((member) => (
            <div class='api-member'>
              <code>{member.signature ?? member.name}</code>
              {member.summary && <span>{member.summary}</span>}
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
