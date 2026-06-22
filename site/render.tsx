import { Example, examples, openApiPath, scalarPath, swaggerPath } from './examples'
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
        /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/.*|\b(?:async|const|default|export|from|import|new|return|type)\b|\b\d+\b)/g,
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

function PageNav() {
  const links = [
    ['Install', '#install'],
    ['OpenAPI JSON', '#openapi-json'],
    ['Existing UI', '#existing-ui'],
    ['Config', '#config'],
    ['Examples', '#examples'],
  ]

  return (
    <>
      {links.map(([label, href]) => (
        <a href={href}>{label}</a>
      ))}
    </>
  )
}

function Icon({ name }: { name: 'swagger' | 'scalar' | 'json' | 'api' }) {
  return (
    <svg
      class="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      {name === 'swagger' && (
        <>
          <path d="M5 5h14v14H5z" />
          <path d="M9 9h6M9 13h6M9 17h3" />
        </>
      )}
      {name === 'scalar' && (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
          <path d="M8 4v16M16 4v16" />
        </>
      )}
      {name === 'json' && (
        <>
          <path d="M8 8 5 12l3 4M16 8l3 4-3 4" />
          <path d="m14 6-4 12" />
        </>
      )}
      {name === 'api' && (
        <>
          <path d="M6 8h12M6 12h12M6 16h7" />
          <path d="M4 4h16v16H4z" />
        </>
      )}
    </svg>
  )
}

function Layout({ title, children }: { title: string; children: Child }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content="Generate OpenAPI from Hono route types." />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230f172a'/%3E%3Cpath d='M9 10h14M9 16h10M9 22h14' stroke='white' stroke-width='2.4' stroke-linecap='round'/%3E%3C/svg%3E"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/assets/site.css?v=3" />
      </head>
      <body>
        <header class="topbar">
          <a class="brand" href="/">
            hono-docs
          </a>
          <nav aria-label="Primary">
            <a href="/#install">Install</a>
            <a href="/#examples">Examples</a>
            <a href="/docs/api">API docs</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}

function ExampleRows() {
  return (
    <>
      {examples.map((example) => (
        <article class="example-row" id={example.slug}>
          <div>
            <h3>{example.name}</h3>
            <p>{example.pattern}</p>
          </div>
          <div>
            <p>{example.description}</p>
            <div class="links example-links">
              <a href={swaggerPath(example)}>
                <Icon name="swagger" /> Open Swagger
              </a>
              <a href={scalarPath(example)}>
                <Icon name="scalar" /> Open Scalar
              </a>
              <a href={openApiPath(example)}>
                <Icon name="json" /> openapi.json
              </a>
            </div>
          </div>
        </article>
      ))}
    </>
  )
}

function ApiTable({ rows }: { rows: [Child, Child][] }) {
  return (
    <div class="api-table">
      {rows.map(([label, description]) => (
        <>
          <div>{label}</div>
          <div>{description}</div>
        </>
      ))}
    </div>
  )
}

export function renderHome() {
  return (
    <Layout title="hono-docs">
      <main class="page">
        <aside class="sidebar" aria-label="On this page">
          <PageNav />
        </aside>
        <div class="content">
          <section class="hero">
            <p class="eyebrow">OpenAPI for Hono</p>
            <h1>Generate OpenAPI from Hono route types.</h1>
            <p class="lead">
              hono-docs reads your typed Hono app and emits an OpenAPI document. Use the JSON with
              Scalar, Swagger UI, or any OpenAPI client tooling.
            </p>
            <div class="actions">
              <a class="button" href="#openapi-json">
                See the Hono example
              </a>
              <a class="button secondary" href="#examples">
                Browse fixtures
              </a>
            </div>
          </section>

          <section class="section" id="install">
            <h2>Install</h2>
            <CodeBlock>pnpm add hono-docs @scalar/hono-api-reference @hono/swagger-ui</CodeBlock>
          </section>

          <section class="section" id="openapi-json">
            <h2>Expose OpenAPI JSON from Hono</h2>
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
          </section>

          <section class="section" id="existing-ui">
            <div>
              <h2>Use existing OpenAPI UI middleware</h2>
              <p>
                hono-docs only needs to expose <code>openapi.json</code>. Existing Hono middleware
                such as Scalar and Swagger UI can read that endpoint without any custom adapter.
              </p>
            </div>
            <div class="code-grid">
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
          </section>

          <section class="section" id="config">
            <h2>Configuration</h2>
            <p>
              Configure the generator with your app type path, output target, OpenAPI metadata, and
              optional manual route metadata.
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

          <section class="section" id="examples">
            <div class="section-heading">
              <h2>Integration apps</h2>
              <p>
                Real Hono apps mounted under <code>/integration/:name</code>, with generated JSON
                and ready-to-open Scalar and Swagger views.
              </p>
            </div>
            <div class="example-list">
              <ExampleRows />
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

export function renderApiDocs() {
  return (
    <Layout title="hono-docs API - hono-docs">
      <main class="page single">
        <div class="content">
          <section class="hero compact">
            <p class="eyebrow">API reference</p>
            <h1>hono-docs public API.</h1>
            <p class="lead">
              The small surface area needed to generate OpenAPI from Hono route types and serve it
              through existing documentation middleware.
            </p>
          </section>

          <section class="section">
            <h2>Runtime middleware</h2>
            <ApiTable
              rows={[
                [<code>serveOpenAPI(options?)</code>, <>Hono handler that serves an OpenAPI JSON document and can generate it when missing.</>],
                [<code>options.config</code>, <>Path to a config file, or an imported <code>HonoDocsConfig</code> object.</>],
                [<code>options.rootPath</code>, <>Project root used to resolve paths when <code>config</code> is an imported object.</>],
                [<code>options.outputPath</code>, <>Explicit JSON file path to serve instead of reading it from config.</>],
                [<code>options.regenerate</code>, <>Controls whether a missing JSON file should be generated. Defaults to <code>true</code>.</>],
              ]}
            />
          </section>

          <section class="section">
            <h2>Config helpers</h2>
            <ApiTable
              rows={[
                [<code>defineConfig(config)</code>, <>No-op helper for typed <code>hono-docs.config.ts</code> files.</>],
                [<code>HonoDocsConfig.tsConfigPath</code>, <>Path to the TypeScript config used by ts-morph.</>],
                [<code>HonoDocsConfig.appTypePath</code>, <>Module exporting <code>AppType = typeof app</code>.</>],
                [<code>HonoDocsConfig.outputs.openApiJson</code>, <>Final OpenAPI JSON output path.</>],
                [<code>HonoDocsConfig.openApi</code>, <>Static OpenAPI metadata such as title, version, servers, and security.</>],
                [<code>HonoDocsConfig.api</code>, <>Optional manual metadata overrides for inferred routes.</>],
                [<code>HonoDocsConfig.excludePaths</code>, <>Paths excluded from generated documentation, usually docs UI and JSON endpoints.</>],
              ]}
            />
          </section>

          <section class="section">
            <h2>Route documentation</h2>
            <ApiTable
              rows={[
                [<code>doc(metadata)</code>, <>Middleware for inline summaries, descriptions, tags, and deprecation metadata.</>],
                [<code>metadata.summary</code>, <>Operation summary.</>],
                [<code>metadata.description</code>, <>Markdown-capable operation description.</>],
                [<code>metadata.tags</code>, <>OpenAPI operation tags.</>],
                [<code>metadata.deprecated</code>, <>Marks an operation as deprecated.</>],
              ]}
            />
          </section>

          <section class="section">
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

export function renderExample(example: Example) {
  return (
    <Layout title={`${example.name} - hono-docs`}>
      <main class="page single">
        <div class="content">
          <section class="hero compact">
            <p class="eyebrow">{example.pattern}</p>
            <h1>{example.name}</h1>
            <p class="lead">{example.description}</p>
            <div class="actions">
              <a class="button" href={swaggerPath(example)}>
                <Icon name="swagger" /> Open Swagger
              </a>
              <a class="button secondary" href={scalarPath(example)}>
                <Icon name="scalar" /> Open Scalar
              </a>
              <a class="button secondary" href={openApiPath(example)}>
                <Icon name="json" /> openapi.json
              </a>
            </div>
          </section>
          <section class="section">
            <h2>Where to look</h2>
            <p>{example.description}</p>
            <ul class="plain-list">
              <li>
                Mounted at <code>{example.mountPath}</code>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </Layout>
  )
}
