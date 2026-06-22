import fs from 'node:fs'
import path, { resolve } from 'node:path'
import createDebug from 'debug'
import { Project } from 'ts-morph'
import { loadConfig } from '../config/loadConfig'
import { generateTypes } from './generateTypes'
import { generateOpenApi } from './generateOpenApi'
import { Api, HonoDocsConfig } from '../types'
import { cleanDefaultResponse } from '../utils/format'
import { getLibDir } from '../utils/libDir'

const debug = createDebug('hono-docs')

/**
 * Generate a safe filename from API group name
 */
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizePathToOpenApi(path: string): string {
  return path.replace(/:([^/]+)/g, '{$1}')
}

export async function runGenerateFromConfig(
  config: HonoDocsConfig,
  rootPath = process.cwd(),
  options: { rebuild?: boolean } = {}
) {
  debug('Initializing ts-morph with tsConfig: %s', config.tsConfigPath)
  const project = new Project({
    tsConfigFilePath: resolve(rootPath, config.tsConfigPath),
  })

  // Dynamically load validation library types if they're installed
  const extraTypeDefs: string[] = []

  // Helper to resolve package directory (not the main file)
  async function tryResolvePackageDir(packageName: string): Promise<string | null> {
    try {
      // Try different resolution methods to get the package directory
      const { createRequire } = await import('module')
      const require = createRequire(import.meta.url)

      // Try to resolve the main module and find its package directory
      try {
        const modulePath = require.resolve(packageName, { paths: [rootPath] })
        // Walk up from the resolved module to find package.json
        let currentDir = path.dirname(modulePath)
        let found = false
        let attempts = 0
        while (attempts < 10) {
          // Prevent infinite loop
          const packageJsonPath = path.join(currentDir, 'package.json')
          if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
            if (packageJson.name === packageName) {
              found = true
              break
            }
          }
          const parent = path.dirname(currentDir)
          if (parent === currentDir) break // Reached filesystem root
          currentDir = parent
          attempts++
        }
        if (found) return currentDir
      } catch (resolveError) {
        debug('Could not resolve %s via require.resolve: %s', packageName, resolveError)
      }

      // Fallback: try to resolve package.json directly (for packages that export it)
      try {
        const packageJsonPath = require.resolve(`${packageName}/package.json`, {
          paths: [rootPath],
        })
        return path.dirname(packageJsonPath)
      } catch (packageJsonError) {
        debug('Could not resolve %s/package.json: %s', packageName, packageJsonError)
      }
    } catch (createRequireError) {
      debug('Could not create require function: %s', createRequireError)
    }

    try {
      // Fallback: check if package.json exists in node_modules
      const packageJsonPath = path.join(rootPath, 'node_modules', packageName, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        return path.dirname(packageJsonPath)
      }
    } catch {
      // Final fallback: try project's node_modules
      const projectPackagePath = path.join(
        __dirname,
        '../../../node_modules',
        packageName,
        'package.json'
      )
      if (fs.existsSync(projectPackagePath)) {
        return path.dirname(projectPackagePath)
      }
    }
    return null
  }

  // Check for Zod validator
  const zodValidatorPath = await tryResolvePackageDir('@hono/zod-validator')
  if (zodValidatorPath) {
    debug('Found @hono/zod-validator, looking for Zod types')
    const zodPath = await tryResolvePackageDir('zod')
    if (zodPath) {
      // Try multiple possible locations for Zod types
      const possibleZodTypesPaths = [
        path.join(zodPath, 'index.d.ts'), // Main types file
        path.join(zodPath, 'index.d.cts'), // CommonJS types file
        path.join(zodPath, 'lib', 'types.d.ts'),
        path.join(zodPath, 'lib', 'index.d.ts'),
        path.join(zodPath, 'src', 'v3', 'types.ts'), // Source types
        path.join(zodPath, 'src', 'v3', 'ZodError.ts'), // Error types
      ]

      // Try to load the actual Zod type definitions
      for (const zodTypesPath of possibleZodTypesPaths) {
        if (fs.existsSync(zodTypesPath)) {
          debug('Loading Zod types from: %s', zodTypesPath)
          const zodTypes = fs.readFileSync(zodTypesPath, 'utf-8')
          extraTypeDefs.push(zodTypes)
          break // Use the first types file we find
        }
      }
    } else {
      debug('Could not find zod package')
    }
  } else {
    debug('@hono/zod-validator not found')
  }

  // Check for Valibot validator
  const valibotValidatorPath = await tryResolvePackageDir('@hono/valibot-validator')
  if (valibotValidatorPath) {
    debug('Found @hono/valibot-validator, looking for Valibot types')
    const valibotPath = await tryResolvePackageDir('valibot')
    if (valibotPath) {
      // Try multiple possible locations for Valibot types
      const possibleValibotTypesPaths = [
        path.join(valibotPath, 'dist', 'index.d.ts'), // Main types file
        path.join(valibotPath, 'dist', 'index.d.cts'), // CommonJS types file
        path.join(valibotPath, 'index.d.ts'), // Root types file
        path.join(valibotPath, 'lib', 'index.d.ts'), // Lib directory
        path.join(valibotPath, 'src', 'index.ts'), // Source types
      ]

      // Try to load the actual Valibot type definitions
      for (const valibotTypesPath of possibleValibotTypesPaths) {
        if (fs.existsSync(valibotTypesPath)) {
          debug('Loading Valibot types from: %s', valibotTypesPath)
          const valibotTypes = fs.readFileSync(valibotTypesPath, 'utf-8')
          extraTypeDefs.push(valibotTypes)
          break // Use the first types file we find
        }
      }
    } else {
      debug('Could not find valibot package')
    }
  } else {
    debug('@hono/valibot-validator not found')
  }

  // Add the collected type definitions to the project
  if (extraTypeDefs.length > 0) {
    debug('Adding %d validation library type definitions to project', extraTypeDefs.length)
    project.createSourceFile('__hono_docs_validation_types.d.ts', extraTypeDefs.join('\n'), {
      overwrite: true,
    })
  }

  // const isDevMode =
  //   __dirname.includes("/src/") || __dirname.includes("\\src\\");

  // const libDir = isDevMode
  //   ? path.resolve(__dirname, "../../")
  //   : // : path.dirname(require.resolve("hono-docs/package.json"));
  //     path.dirname(fileURLToPath(import.meta.url));
  const libDir = getLibDir()
  debug('Library root directory: %s', libDir)

  // Create a single API group from the flattened config
  const apiGroup = {
    name: config.name,
    appTypePath: config.appTypePath,
    api: config.api,
    excludePaths: config.excludePaths,
  }

  const snapshotOutputRoot = path.resolve(libDir, 'output/types')
  const openAPiOutputRoot = path.resolve(libDir, 'output/openapi')

  // Force clean rebuild if requested
  if (options.rebuild) {
    debug('Rebuild requested - cleaning intermediate output directories')
    if (fs.existsSync(snapshotOutputRoot)) {
      fs.rmSync(snapshotOutputRoot, { recursive: true, force: true })
      debug('Removed types output directory: %s', snapshotOutputRoot)
    }
    if (fs.existsSync(openAPiOutputRoot)) {
      fs.rmSync(openAPiOutputRoot, { recursive: true, force: true })
      debug('Removed OpenAPI output directory: %s', openAPiOutputRoot)
    }
  }

  const commonParams = {
    config,
    libDir,
    project,
    rootPath,
  }

  const sanitizedName = sanitizeFileName(apiGroup.name)

  const snapshotPath = await generateTypes({
    ...commonParams,
    apiGroup: apiGroup,
    fileName: sanitizedName,
    outputRoot: snapshotOutputRoot,
  })

  debug(
    'About to call generateOpenApi for: %s (source: %s)',
    snapshotPath.appTypePath,
    apiGroup.appTypePath
  )
  await generateOpenApi({
    snapshotPath,
    apiGroup,
    ...commonParams,
    fileName: sanitizedName,
    outputRoot: openAPiOutputRoot,
  })
  debug('generateOpenApi completed for: %s', apiGroup.appTypePath)

  // Load the generated OpenAPI file
  const name = sanitizeFileName(apiGroup.name)
  const openApiFile = path.join(openAPiOutputRoot, `${name}.json`)

  if (!fs.existsSync(openApiFile)) {
    throw new Error(`Missing OpenAPI file: ${openApiFile}`)
  }

  const json = JSON.parse(fs.readFileSync(openApiFile, 'utf-8'))

  const merged = {
    ...config.openApi,
    tags: [{ name: apiGroup.name }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paths: {} as Record<string, any>,
  }

  const customApiMap = new Map<string, Api>()

  if (apiGroup?.api) {
    for (const customApi of apiGroup.api) {
      const fullPath = normalizePathToOpenApi(customApi.api.replace(/\/+$/, '') || '/')
      customApiMap.set(`${customApi.method.toLowerCase()} ${fullPath}`, customApi)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [pathKey, operations] of Object.entries<any>(json.paths)) {
    // Paths now come directly from Hono routes (no additional prefixing)
    const apiPath = pathKey

    if (!merged.paths[apiPath]) merged.paths[apiPath] = {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const [method, operation] of Object.entries<any>(operations)) {
      const opKey = `${method.toLowerCase()} ${apiPath}`
      const customApi = customApiMap.get(opKey)

      // Override or enrich metadata if defined
      if (customApi) {
        operation.summary = customApi.summary || operation.summary
        operation.description = customApi.description || operation.description
        operation.tags = customApi.tag && customApi.tag.length > 0 ? customApi.tag : [apiGroup.name]
      } else {
        if (!operation.tags || operation.tags.length === 0) {
          operation.tags = [apiGroup.name]
        }
      }

      cleanDefaultResponse(operation, apiPath, method)
      merged.paths[apiPath][method] = operation
    }
  }

  const outputPath = path.resolve(rootPath, config.outputs.openApiJson)

  // Clean up any existing file first to avoid stale data
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath)
    debug('Removed existing final OpenAPI file: %s', outputPath)
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`)

  console.log(`✅ OpenAPI spec written to: ${outputPath}`)
}

export async function runGenerate(configPath: string, options: { rebuild?: boolean } = {}) {
  const fullConfigPath = resolve(configPath)
  const config = await loadConfig(fullConfigPath)

  await runGenerateFromConfig(config, path.dirname(fullConfigPath), options)
}
