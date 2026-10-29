// Pages hosts project sites under /<repository>; local development stays at /.
const basePath = (process.env.SITE_BASE_PATH ?? '').replace(/\/$/, '')
export const isStaticSite = process.env.SITE_STATIC === 'true'

export function sitePath(path: string): string {
  return `${basePath}${path}`
}
