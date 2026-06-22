import fs from 'node:fs/promises'
import path from 'node:path'
import { swaggerUI } from '@hono/swagger-ui'
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { runGenerate } from 'hono-docs'
import groupedBasePathApp from '../integration/grouped-basepath/app'
import groupedComplexApp from '../integration/grouped-complex/app'
import groupedNestedApp from '../integration/grouped-nested/app'
import groupedSimpleApp from '../integration/grouped-simple/app'
import manualRoutesApp from '../integration/manual-routes/app'
import middlewareDocsApp from '../integration/middleware-docs/app'
import simpleRouterApp from '../integration/simple-router/app'
import {
  getExampleAppPath,
  getExampleConfigPath,
  getExampleMountPath,
  getExampleSlug,
  loadExamples,
  openApiPath,
  swaggerPath,
} from './examples'
import type { Example } from './examples'
import { renderApiDocs, renderHome } from './render'
import { styles } from './styles'

const app = new Hono()

app.get('/', async (c) => {
  const examples = await loadExamples()

  return c.html(renderHome(examples, await readExampleSources(examples)))
})

app.get('/docs/api', (c) => c.html(renderApiDocs()))

app.get('/api/examples', async (c) => c.json({ examples: await loadExamples() }))

app.get(
  '/examples/:slug/scalar',
  Scalar((c: Context) => {
    const slug = getExampleSlug(c.req.param('slug') ?? '')

    return {
      url: slug ? `${getExampleMountPath(slug)}/openapi.json` : '/api/examples',
      theme: 'kepler',
      layout: 'modern',
    }
  })
)

for (const example of await loadExamples()) {
  app.get(swaggerPath(example), swaggerUI({ url: openApiPath(example) }))
}

app.get('/integration/:slug/openapi.json', async (c) => {
  const slug = getExampleSlug(c.req.param('slug'))

  if (!slug) {
    return c.notFound()
  }

  const fixtureDir = path.join(process.cwd(), 'integration', slug)
  const configPath = getExampleConfigPath(slug)
  const filePath = path.join(fixtureDir, 'openapi.json')

  try {
    await fs.access(filePath)
  } catch {
    await runGenerate(configPath)
  }

  const raw = await fs.readFile(filePath, 'utf-8')

  return c.json(JSON.parse(raw))
})

app.route('/integration/simple-router', simpleRouterApp)
app.route('/integration/grouped-simple', groupedSimpleApp)
app.route('/integration/grouped-basepath', groupedBasePathApp)
app.route('/integration/grouped-complex', groupedComplexApp)
app.route('/integration/grouped-nested', groupedNestedApp)
app.route('/integration/manual-routes', manualRoutesApp)
app.route('/integration/middleware-docs', middlewareDocsApp)

app.get('/assets/site.css', (c) =>
  c.body(styles, 200, {
    'content-type': 'text/css; charset=utf-8',
    'cache-control': 'no-store',
  })
)

async function readExampleSources(examples: Example[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    examples.map(async (example) => {
      try {
        return [example.slug, await fs.readFile(getExampleAppPath(example.slug), 'utf-8')] as const
      } catch {
        return [example.slug, 'Unable to load integration app source.'] as const
      }
    })
  )

  return Object.fromEntries(entries)
}

export default app
