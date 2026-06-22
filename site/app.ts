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
import { examples, getExample, openApiPath, swaggerPath } from './examples'
import { renderApiDocs, renderExample, renderHome } from './render'
import { styles } from './styles'

const app = new Hono()

app.get('/', (c) => c.html(renderHome()))

app.get('/docs/api', (c) => c.html(renderApiDocs()))

app.get('/examples/:slug', (c) => {
  const example = getExample(c.req.param('slug'))

  if (!example) {
    return c.notFound()
  }

  return c.html(renderExample(example))
})

app.get('/api/examples', (c) => c.json({ examples }))

app.get(
  '/examples/:slug/scalar',
  Scalar((c: Context) => {
    const example = getExample(c.req.param('slug') ?? '')

    return {
      url: example ? openApiPath(example) : '/api/examples',
      theme: 'kepler',
      layout: 'modern',
    }
  })
)

for (const example of examples) {
  app.get(swaggerPath(example), swaggerUI({ url: openApiPath(example) }))
}

app.get('/integration/:slug/openapi.json', async (c) => {
  const example = getExample(c.req.param('slug'))

  if (!example) {
    return c.notFound()
  }

  const fixtureDir = path.join(process.cwd(), 'integration', example.slug)
  const configFile = example.slug === 'manual-routes' ? 'hono-docs.ts' : 'hono-docs.config.ts'
  const configPath = path.join(fixtureDir, configFile)
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

export default app
