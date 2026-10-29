import fs from 'node:fs/promises'
import path from 'node:path'
import app from './app'
import { loadExamples } from './examples'
import { runGenerate } from '../src/core/runGenerate'

const outputDir = path.resolve('_site')
await fs.rm(outputDir, { recursive: true, force: true })
const routes = ['/', '/docs/api', '/assets/site.css']

for (const example of await loadExamples()) {
  // Always regenerate so a previous local build cannot leave stale API docs.
  await runGenerate(example.configPath)
  routes.push(
    `/integration/${example.slug}/openapi.json`,
    `/examples/${example.slug}/swagger`,
    `/examples/${example.slug}/scalar`
  )
}

for (const route of routes) {
  const response = await app.request(`http://localhost${route}`)
  if (!response.ok) {
    throw new Error(`Failed to export ${route}: HTTP ${response.status}`)
  }

  const filename = path.extname(route) ? route : `${route.replace(/\/$/, '')}/index.html`
  const destination = path.join(outputDir, filename)
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.writeFile(destination, await response.text())
}

await fs.writeFile(path.join(outputDir, '.nojekyll'), '')
console.log(`Exported ${routes.length} pages and assets to ${outputDir}`)
