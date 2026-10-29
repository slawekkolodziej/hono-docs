import { sitePath } from './paths'
import path from 'node:path'
import { loadConfig } from '../src/config/loadConfig'

export type Example = {
  slug: string
  name: string
  title: string
  description: string
  mountPath: string
  configPath: string
}

const exampleSlugs = [
  'simple-router',
  'with-zod-validator',
  'with-valibot-validator',
  'nested-router',
  'nested-router-advanced',
  'with-base-path',
  'doc-middleware',
  'middleware-response',
  'real-world-app',
]

export const integrationDir = path.join(process.cwd(), 'integration')

export function getExampleSlug(slug: string): string | undefined {
  return exampleSlugs.find((exampleSlug) => exampleSlug === slug)
}

export function getExampleMountPath(slug: string): string {
  return `/integration/${slug}`
}

export function getExampleConfigPath(slug: string): string {
  return path.join(integrationDir, slug, 'hono-docs.config.ts')
}

export function getExampleAppPath(slug: string): string {
  return path.join(integrationDir, slug, 'app.ts')
}

export function openApiPath(example: Example): string {
  return sitePath(`${example.mountPath}/openapi.json`)
}

export function scalarPath(example: Example): string {
  return sitePath(`/examples/${example.slug}/scalar`)
}

export function swaggerPath(example: Example): string {
  return sitePath(`/examples/${example.slug}/swagger`)
}

export async function loadExamples(): Promise<Example[]> {
  return Promise.all(exampleSlugs.map(loadExample))
}

async function loadExample(slug: string): Promise<Example> {
  const configPath = getExampleConfigPath(slug)
  const config = await loadConfig(configPath)
  const title = config.openApi.info.title
  const name = config.name || title

  return {
    slug,
    name,
    title,
    description: config.openApi.info.description ?? title,
    mountPath: getExampleMountPath(slug),
    configPath,
  }
}
