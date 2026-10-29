# hono-docs

Generate an OpenAPI 3.0 document from your Hono route types. Keep routes and
validation in your app, then use the generated JSON with Swagger, Scalar, or
other OpenAPI tools.

[Documentation and examples](https://slawekkolodziej.github.io/hono-docs/) ·
[API reference](https://slawekkolodziej.github.io/hono-docs/docs/api/)

## Install

Requires Node.js 22.18+ and Hono 4.13.14 or later in the v4 series.

```sh
pnpm add -D hono-docs
```

If you use `doc()` or `serveOpenAPI()` in your running app, install it as a
regular dependency instead: `pnpm add hono-docs`.

## Generate your first spec

Define your routes as a chain and export their type:

```ts
// src/app.ts
import { Hono } from 'hono'

const app = new Hono()
  .get('/users', (c) => c.json({ users: [] }))
  .get('/users/:id', (c) => c.json({ id: c.req.param('id') }))

export type AppType = typeof app
export default app
```

Create `hono-docs.config.ts` in your project root:

```ts
import { defineConfig } from 'hono-docs'

export default defineConfig({
  name: 'My API',
  tsConfigPath: './tsconfig.json',
  appTypePath: './src/app.ts',
  outputs: { openApiJson: './openapi.json' },
  openApi: {
    openapi: '3.0.0',
    info: { title: 'My API', version: '1.0.0' },
  },
})
```

Run the generator:

```sh
pnpm exec hono-docs generate --config hono-docs.config.ts
```

This writes `openapi.json`. Use `--rebuild` to discard cached intermediate files
and generate it again from scratch.

## Add descriptions next to your routes

Types provide the request and response shapes. Use `doc()` for summaries,
descriptions, tags, and deprecation notices:

```ts
import { Hono } from 'hono'
import { doc } from 'hono-docs'

const app = new Hono().get(
  '/users/:id',
  doc({ summary: 'Get a user', tags: ['Users'] }),
  (c) => c.json({ id: c.req.param('id') })
)

export type AppType = typeof app
export default app
```

`doc()` adds documentation metadata without changing how the request is handled.
You can also set route metadata in the config. See the
[API reference](https://slawekkolodziej.github.io/hono-docs/docs/api/).

## Display the docs in your app

Install a viewer, for example `pnpm add @scalar/hono-api-reference`, then serve
the generated JSON:

```ts
import { Scalar } from '@scalar/hono-api-reference'
import { serveOpenAPI } from 'hono-docs'

app.get('/openapi.json', serveOpenAPI({
  outputPath: './openapi.json',
  regenerate: false,
}))
app.get('/docs', Scalar({ url: '/openapi.json' }))
```

Generate the file during your build. With `regenerate: false`, the handler serves
the existing file without running TypeScript analysis on a request. This handler
needs Node.js filesystem access.

## What it supports

- JSON responses and status codes inferred from handlers.
- Request bodies, query parameters, and path parameters from supported validators.
- Nested routers composed with `.route()` and prefixes added with `.basePath()`.
- Route metadata from `doc()` or config overrides.
- Excluding paths with `excludePaths`, using strings or regular expressions.

Keep in mind:

- Chain route definitions so `AppType` retains their types.
- Explicitly widening a handler to `MiddlewareHandler` can erase its response details.
- Responses from `.use()` are not currently included in the generated route schema.
- The Zod and Valibot hook fallback fixes are pending in
  [middleware PR #2227](https://github.com/honojs/middleware/pull/2227).
  Without them, hooks returning `void` or `undefined` can hide the default `400`
  response from the generated spec.

Browse the [working examples](https://slawekkolodziej.github.io/hono-docs/#examples)
for complete apps, generated JSON, Swagger, and Scalar views.

## Use it from a script

```ts
import { runGenerate } from 'hono-docs'

await runGenerate('./hono-docs.config.ts')
```

For generator logs, run the CLI with `DEBUG=hono-docs`.

## Work on this project

Use Node.js 24 and pnpm 10.33.2. Until the validator fixes are released upstream,
the development fixtures need our middleware fork in a sibling directory:

```sh
git clone --branch fix/validator-response-types-latest https://github.com/slawekkolodziej/hono-middleware.git middleware
git clone https://github.com/slawekkolodziej/hono-docs.git
cd hono-docs
pnpm install
pnpm build
pnpm test
```

Run `pnpm dev` for the documentation server, including the example APIs.
To preview the static site:

```sh
pnpm site.export
pnpm site.preview
```

Open [localhost:8080](http://localhost:8080). The static version includes the
reference docs and example specs; executing API requests is disabled.

Other checks: `pnpm lint`, `pnpm test.coverage`, and `pnpm package.check`.

## Deploy and release

**Documentation:** pushes to `main` run CI and deploy to GitHub Pages. You can
also run the **Release GitHub Pages** workflow manually. All tests must pass
before deployment.

**npm:** pushing a `vX.Y.Z` tag runs CI and publishes the tested package. The tag
must match `package.json`. Stable versions use `latest`; prereleases use `next`.

From an up-to-date `main`:

```sh
npm version patch
git push origin main --follow-tags
```

The first publication needs an npm publishing token in the repository secret
`NPM_TOKEN`. Once the package exists, configure an npm Trusted Publisher for
`slawekkolodziej/hono-docs`, workflow `release.yml`, with direct publishing
allowed and no environment name. Then remove the token; later releases use OIDC.

## License

[MIT](LICENSE)
