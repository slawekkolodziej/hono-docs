import type { DeclarationReflection, ParameterReflection, SignatureReflection } from 'typedoc'

export type ApiReferenceMember = {
  name: string
  kind: 'function' | 'type'
  summary: string
  signature?: string
  members?: ApiReferenceMember[]
}

export type ApiReferenceSection = {
  title: string
  description: string
  functions: ApiReferenceMember[]
  types: ApiReferenceMember[]
}

const sectionMap = [
  {
    title: 'Runtime middlewares',
    description: 'Handlers and middleware used inside a Hono app at runtime.',
    symbols: ['serveOpenAPI', 'ServeOpenAPIConfig', 'ServeOpenAPIResponse', 'doc', 'DocConfig'],
  },
  {
    title: 'Generation config',
    description: 'Types and helpers used by hono-docs config files and generation scripts.',
    symbols: ['defineConfig', 'generateOpenAPI', 'HonoDocsConfig', 'OpenAPIConfig', 'Api'],
  },
]

let apiReferencePromise: Promise<ApiReferenceSection[]> | undefined

export function getApiReference(): Promise<ApiReferenceSection[]> {
  apiReferencePromise ??= loadApiReference()

  return apiReferencePromise
}

async function loadApiReference(): Promise<ApiReferenceSection[]> {
  const importRuntime = (moduleName: string) =>
    import(moduleName) as Promise<typeof import('typedoc')>
  const { Application, LogLevel } = await importRuntime('typedoc')
  const app = await Application.bootstrap({
    entryPoints: [`${process.cwd()}/src/index.ts`],
    tsconfig: `${process.cwd()}/tsconfig.json`,
    skipErrorChecking: true,
    excludeInternal: true,
    excludePrivate: true,
    readme: 'none',
    logLevel: LogLevel.None,
  })
  const project = await app.convert()
  const reflections = new Map(
    (project?.children ?? []).map((reflection) => [reflection.name, reflection])
  )

  return sectionMap
    .map((section) => {
      const items = section.symbols
        .map((symbol) => reflections.get(symbol))
        .filter((reflection): reflection is DeclarationReflection => Boolean(reflection))
        .map(toReferenceMember)

      return {
        title: section.title,
        description: section.description,
        functions: items.filter((item) => item.kind === 'function'),
        types: items.filter((item) => item.kind === 'type'),
      }
    })
    .filter((section) => section.functions.length > 0 || section.types.length > 0)
}

function toReferenceMember(reflection: DeclarationReflection): ApiReferenceMember {
  const signature = reflection.signatures?.[0]
  const summary = commentText(signature) || commentText(reflection)

  return {
    name: reflection.name,
    kind: signature ? 'function' : 'type',
    summary,
    signature: signature ? renderSignature(reflection.name, signature) : undefined,
    members: reflection.children
      ?.map((child) => ({
        name: child.name,
        kind: 'type' as const,
        summary: commentText(child),
        signature: child.type ? `${child.name}: ${String(child.type)}` : child.name,
      }))
      .filter((child) => child.summary || child.signature),
  }
}

function renderSignature(name: string, signature: SignatureReflection): string {
  const params = signature.parameters?.map(renderParameter).join(', ') ?? ''
  const typeParams = signature.typeParameters?.map((param) => param.name).join(', ')
  const generic = typeParams ? `<${typeParams}>` : ''
  const returnType = signature.type ? `: ${String(signature.type)}` : ''

  return `${name}${generic}(${params})${returnType}`
}

function renderParameter(parameter: ParameterReflection): string {
  const optional = parameter.flags.isOptional ? '?' : ''
  const type = parameter.type ? `: ${String(parameter.type)}` : ''

  return `${parameter.name}${optional}${type}`
}

function commentText(reflection: DeclarationReflection | SignatureReflection | undefined): string {
  return (
    reflection?.comment?.summary
      ?.map((part) => part.text)
      .join('')
      .replace(/\s+/g, ' ')
      .trim() ?? ''
  )
}
