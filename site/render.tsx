import dedent from 'dedent'
import { getApiReference } from './api-reference'
import type { ApiReferenceSection } from './api-reference'
import { ApiReference } from './components/api-reference'
import { CodeBlock } from './components/code-block'
import { ExampleList } from './components/example-list'
import { Hero } from './components/hero'
import { Layout } from './components/layout'
import { AnchorHeading } from './components/markdown'
import { ScrollSpyMenu } from './components/page-nav'
import type { NavGroup } from './components/page-nav'
import { slugify } from './components/text'
import type { Example } from './examples'

export function renderHome(examples: Example[], appSources: Record<string, string>) {
  return (
    <Layout title='hono-docs'>
      <main class='page'>
        <aside class='sidebar' aria-label='On this page'>
          <ScrollSpyMenu groups={homeNavGroups(examples)} />
        </aside>
        <div class='content'>
          <Hero
            eyebrow='OpenAPI for Hono'
            title='Generate OpenAPI from Hono route types.'
            lead='hono-docs reads your typed Hono app and emits an OpenAPI document. Use the JSON with Scalar, Swagger UI, or any OpenAPI client tooling.'
            actions={
              <div class='actions'>
                <a class='button' href='#get-started'>
                  Get started
                </a>
                <a class='button secondary' href='#examples'>
                  Browse examples
                </a>
              </div>
            }
          />

          <section class='section'>
            <div class='section-intro'>
              <AnchorHeading level={2} id='get-started'>
                Getting started
              </AnchorHeading>
              <p>
                Add the package, expose <code>openapi.json</code>, then point any OpenAPI UI at that
                JSON endpoint.
              </p>
            </div>

            <article class='setup-step'>
              <AnchorHeading level={3} id='install'>
                Install
              </AnchorHeading>
              <p>Add the npm modules used by the generator and optional UI middleware.</p>
              <CodeBlock>pnpm add hono-docs @scalar/hono-api-reference @hono/swagger-ui</CodeBlock>
            </article>

            <article class='setup-step'>
              <AnchorHeading level={3} id='openapi-json'>
                Expose OpenAPI JSON from Hono
              </AnchorHeading>
              <p>
                Add the OpenAPI middleware to your app. The generated document is based on the
                exported <code>AppType</code>.
              </p>
              <CodeBlock>
                {dedent`
                  import { Hono } from "hono";
                  import { serveOpenAPI } from "hono-docs";

                  const app = new Hono()
                    .get("/users", (c) => c.json({ users: [] }))
                    .get("/users/:id", (c) => c.json({ id: c.req.param("id") }))
                    .get("/openapi.json", serveOpenAPI());

                  export type AppType = typeof app;
                  export default app;
                `}
              </CodeBlock>
            </article>

            <article class='setup-step'>
              <AnchorHeading level={3} id='existing-ui'>
                Use existing OpenAPI UI middleware
              </AnchorHeading>
              <p>
                hono-docs only needs to expose <code>openapi.json</code>. Existing Hono middleware
                such as Scalar and Swagger UI can read that endpoint without any custom adapter.
              </p>
              <div class='code-grid'>
                <CodeBlock>
                  {dedent`
                    import { Scalar } from "@scalar/hono-api-reference";

                    app.get("/docs", Scalar({
                      url: "/openapi.json",
                    }));
                  `}
                </CodeBlock>
                <CodeBlock>
                  {dedent`
                    import { swaggerUI } from "@hono/swagger-ui";

                    app.get("/swagger", swaggerUI({
                      url: "/openapi.json",
                    }));
                  `}
                </CodeBlock>
              </div>
            </article>
          </section>

          <section class='section'>
            <AnchorHeading level={2} id='config'>
              Configuration
            </AnchorHeading>
            <p>
              Configure the generator with the TypeScript project, exported app type, output target,
              OpenAPI metadata, and explicit exclusions for routes that should not appear in the
              generated document.
            </p>
            <CodeBlock>
              {dedent`
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
              `}
            </CodeBlock>
          </section>

          <section class='section'>
            <AnchorHeading level={2} id='doc-middleware'>
              doc() middleware
            </AnchorHeading>
            <p>
              <code>doc()</code> is a no-op Hono middleware. It does not change request handling,
              response handling, validation, or runtime behavior. hono-docs reads it at generation
              time to add OpenAPI operation metadata next to the route that owns it.
            </p>
            <CodeBlock>
              {dedent`
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
              `}
            </CodeBlock>
          </section>

          <section class='section'>
            <div class='section-heading'>
              <AnchorHeading level={2} id='examples'>
                Integration apps
              </AnchorHeading>
              <p>
                Real Hono apps mounted under <code>/integration/:name</code>, with generated JSON
                and ready-to-open Scalar and Swagger views.
              </p>
            </div>
            <ExampleList examples={examples} appSources={appSources} />
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
          <ScrollSpyMenu groups={apiNavGroups(sections)} />
        </aside>
        <div class='content'>
          <Hero
            id='api-overview'
            eyebrow='API reference'
            title='hono-docs public API.'
            lead='Generated from TSDoc comments on the exported TypeScript surface. OpenAPI generation remains focused on your Hono routes; this page documents the library API you call.'
          />

          <ApiReference sections={sections} />

          <section class='section'>
            <AnchorHeading level={2} id='cli'>
              CLI
            </AnchorHeading>
            <CodeBlock>
              {dedent`
                pnpm hono-docs generate --config hono-docs.config.ts
                pnpm hono-docs generate --config hono-docs.config.ts --rebuild
              `}
            </CodeBlock>
          </section>
        </div>
      </main>
    </Layout>
  )
}

function homeNavGroups(examples: Example[]): NavGroup[] {
  return [
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
        ...examples.map((example): [string, string] => [example.name, `#example-${example.slug}`]),
      ],
    },
  ]
}

function apiNavGroups(sections: ApiReferenceSection[]): NavGroup[] {
  return [
    ...sections.map((section) => {
      const sectionSlug = slugify(section.title)
      const links: [string, string][] = [[section.title, `#${sectionSlug}`]]

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
}
