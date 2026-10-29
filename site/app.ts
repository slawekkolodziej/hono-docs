import { isStaticSite, sitePath } from './paths'
import fs from 'node:fs/promises'
import path from 'node:path'
import { swaggerUI } from '@hono/swagger-ui'
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import type { Context } from 'hono'
import docMiddlewareApp from '../integration/doc-middleware/app'
import middlewareResponseApp from '../integration/middleware-response/app'
import nestedRouterApp from '../integration/nested-router/app'
import nestedRouterAdvancedApp from '../integration/nested-router-advanced/app'
import realWorldApp from '../integration/real-world-app/app'
import simpleRouterApp from '../integration/simple-router/app'
import withBasePathApp from '../integration/with-base-path/app'
import withValibotValidatorApp from '../integration/with-valibot-validator/app'
import withZodValidatorApp from '../integration/with-zod-validator/app'
import { runGenerate } from '../src/core/runGenerate'
import {
  getExampleAppPath,
  getExampleConfigPath,
  getExampleMountPath,
  getExampleSlug,
  loadExamples,
  openApiPath,
} from './examples'
import type { Example } from './examples'
import { renderApiDocs, renderHome } from './render'
import { styles } from './styles'

const app = new Hono()

app.get('/', async (c) => {
  const examples = await loadExamples()

  return c.html(renderHome(examples, await readExampleSources(examples)))
})

app.get('/docs/api', async (c) => c.html(await renderApiDocs()))

app.get('/api/examples', async (c) => c.json({ examples: await loadExamples() }))

app.get(
  '/examples/:slug/scalar',
  Scalar((c: Context) => {
    const slug = getExampleSlug(c.req.param('slug') ?? '')

    return {
      url: sitePath(slug ? `${getExampleMountPath(slug)}/openapi.json` : '/api/examples'),
      hideTestRequestButton: isStaticSite,
      theme: 'kepler',
      layout: 'modern',
    }
  })
)

for (const example of await loadExamples()) {
  app.get(
    `/examples/${example.slug}/swagger`,
    swaggerUI({
      url: openApiPath(example),
      ...(isStaticSite ? { supportedSubmitMethods: [] } : {}),
    })
  )
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
app.route('/integration/with-zod-validator', withZodValidatorApp)
app.route('/integration/with-valibot-validator', withValibotValidatorApp)
app.route('/integration/nested-router', nestedRouterApp)
app.route('/integration/nested-router-advanced', nestedRouterAdvancedApp)
app.route('/integration/with-base-path', withBasePathApp)
app.route('/integration/doc-middleware', docMiddlewareApp)
app.route('/integration/middleware-response', middlewareResponseApp)
app.route('/integration/real-world-app', realWorldApp)

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
