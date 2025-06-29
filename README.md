# @rcmade/hono-docs

> Auto-generate OpenAPI 3.0 spec and TypeScript type snapshots from Hono route type definitions

---

## Features

- **One-stop CLI** (`hono-docs generate`) to:
  - Extract your route `AppType` definitions via **ts-morph**
  - Emit `.d.ts` “snapshot” files per API prefix under `output/types`
  - Generate a merged `openapi.json` spec at your configured output path
- Full TypeScript support (TS & JS config files, inference via `defineConfig`)

---

## Table of Contents

- [@rcmade/hono-docs](#rcmadehono-docs)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Install](#install)
  - [Quick Start](#quick-start)
  - [⚠️ Limitations: Grouped `AppType` Not Supported](#️-limitations-grouped-apptype-not-supported)
    - [✅ Supported: Individual AppType per Module](#-supported-individual-apptype-per-module)
  - [Serving the OpenAPI Docs](#serving-the-openapi-docs)
  - [Configuration](#configuration)
  - [CLI Usage](#cli-usage)
  - [Programmatic Usage](#programmatic-usage)
  - [Examples](#examples)
  - [Development](#development)
  - [Contributing](#contributing)
  - [License](#license)

---

## Install

```bash
# using npm
npm install --save-dev @rcmade/hono-docs

# using pnpm
pnpm add -D @rcmade/hono-docs

# using yarn
yarn add -D @rcmade/hono-docs
```

---

## Quick Start

1. **Create a config file** at the root of your project (`hono-docs.ts`):

   ```ts
   import { defineConfig } from "@rcmade/hono-docs";

   export default defineConfig({
     tsConfigPath: "./tsconfig.json",
     openApi: {
       openapi: "3.0.0",
       info: { title: "My API", version: "1.0.0" },
       servers: [{ url: "http://localhost:3000" }],
     },
     outputs: {
       openApiJson: "./openapi/openapi.json",
     },
     apis: [
       {
         name: "Auth Routes",
         apiPrefix: "/auth", // This will be prepended to all `api` values below
         appTypePath: "src/routes/authRoutes.ts", // Path to your AppType export

         api: [
           // ✅ Custom OpenAPI metadata for the GET /auth/u/{id} endpoint
           {
             api: "/u/{id}", // Final route = /auth/u/{id}
             method: "get",
             summary: "Fetch user by ID", // Optional: title shown in docs
             description: "Returns a user object based on the provided ID.",
             tag: ["User"],
           },

           // ✅ Another example with metadata for GET /auth
           {
             api: "/", // Final route = /auth/
             method: "get",
             summary: "Get current user",
             description:
               "Returns the currently authenticated user's information.",
             tag: ["User Info"],
           },
         ],
       },
     ],
   });
   ```

2. **Route Definitions & AppType**
   This library supports **only change routes** via a single AppType export in your routes file. You **must** export:

   ```ts
   export type AppType = typeof yourRoutesVariable;
   ```

   **Example:**

   ```ts
   // src/routes/userRoutes.ts
   import { Hono } from "hono";
   import { z } from "zod";

   export const userRoutes = new Hono()
     .get("/u/:id", (c) => {
       /* … */
     })
     .post("/", async (c) => {
       /* … */
     });
   // Must add AppType
   export type AppType = typeof userRoutes;
   export default userRoutes;
   ```

   ## ⚠️ Limitations: Grouped `AppType` Not Supported

   Currently, `@rcmade/hono-docs` **does not support** extracting route types from a grouped `AppType` where multiple sub-apps are composed using `.route()` or `.basePath()` on a single root app.

   For example, the following pattern **is not supported**:

   ```ts
   import { Hono } from "hono";
   import { docs } from "./docs";
   import { userRoutes } from "./userRoutes";

   const app = new Hono()
     .basePath("/api")
     .get("/", (c) => {
       return c.text("Hello Hono!");
     })
     .route("/docs", docs)
     .route("/user", userRoutes);

   // ❌ This AppType is not supported
   type AppType = typeof app;
   ```

   ### ✅ Supported: Individual AppType per Module

   Instead, define and export `AppType` individually for each route module:

   ```ts
   // docs.ts
   import { Hono } from "hono";
   import { Scalar } from "hono-scalar";
   import fs from "node:fs/promises";
   import path from "node:path";

   const docs = new Hono()
     .get(
       "/",
       Scalar({
         url: "/api/docs/open-api",
         theme: "kepler",
         layout: "modern",
         defaultHttpClient: { targetKey: "js", clientKey: "axios" },
       })
     )
     .get("/open-api", async (c) => {
       const raw = await fs.readFile(
         path.join(process.cwd(), "./openapi/openapi.json"),
         "utf-8"
       );
       return c.json(JSON.parse(raw));
     });

   // ✅ This AppType is supported
   export type AppType = typeof docs;
   ```

   ```ts
   // userRoutes.ts
   import { Hono } from "hono";

   export const userRoutes = new Hono()
     .get("/", (c) => c.json({ name: "current user" }))
     .get("/u/:id", (c) => c.json({ id: c.req.param("id") }));

   // ✅ This AppType is supported
   export type AppType = typeof userRoutes;
   ```

3. **Add an npm script** to `package.json`:

   ```jsonc
   {
     "scripts": {
       "docs": "npx @rcmade/hono-docs generate --config ./hono-docs.ts"
     }
   }
   ```

4. **Run the CLI**:

   ```bash
   npm run docs
   # or
   npx hono-docs generate --config ./hono-docs.ts
   ```

   You’ll see:

   ```text
   ⏳ Generating Type Snapshots…
   ✅ Wrote: node_modules/@rcmade/hono-docs/output/types/user.d.ts
   ⏳ Generating OpenAPI Spec…
   ✅ OpenAPI written to ./openapi/openapi.json
   🎉 Done
   ```

---

## Serving the OpenAPI Docs

Install the viewer:

```bash
# npm
npm install @scalar/hono-api-reference

# yarn
yarn add @scalar/hono-api-reference

# pnpm
pnpm add @scalar/hono-api-reference
```

Mount in your Hono app:

```ts
// src/routes/docs.ts
import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import fs from "node:fs/promises";
import path from "node:path";

const docs = new Hono()
  .get(
    "/",
    Scalar({
      url: "/api/docs/open-api",
      theme: "kepler",
      layout: "modern",
      defaultHttpClient: { targetKey: "js", clientKey: "axios" },
    })
  )
  .get("/open-api", async (c) => {
    const raw = await fs.readFile(
      path.join(process.cwd(), "./openapi/openapi.json"),
      "utf-8"
    );
    return c.json(JSON.parse(raw));
  });

export type AppType = typeof docs;
export default docs;
```

In `src/index.ts`:

```ts
import { Hono } from "hono";
import docs from "./routes/docs";
import userRoutes from "./routes/userRoutes";

export default new Hono()
  .basePath("/api")
  .route("/docs", docs)
  .route("/user", userRoutes);
```

Visiting `/api/docs` shows the UI; `/api/docs/open-api` serves the JSON.

---

## Configuration

All options live in your `defineConfig({ ... })` object:

| Field                    | Type                                                     | Required | Description                                                       |
| ------------------------ | -------------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `tsConfigPath`           | `string`                                                 | Yes      | Path to your project’s `tsconfig.json`                            |
| `openApi`                | `object`                                                 | Yes      | Base OpenAPI fields                                               |
| `openApi.openapi`        | `string`                                                 | Yes      | OpenAPI version (e.g. `"3.0.0"`)                                  |
| `openApi.info`           | `{ title: string; version: string }`                     | Yes      | API title & version                                               |
| `openApi.servers`        | `Array<{ url: string }>`                                 | Yes      | List of server URL objects                                        |
| `outputs`                | `object`                                                 | Yes      | Output paths                                                      |
| `outputs.openApiJson`    | `string`                                                 | Yes      | File path for generated `openapi.json`                            |
| `apis`                   | `Array<ApiBlock>`                                        | Yes      | One block per group of routes                                     |
| ‐ `ApiBlock.name`        | `string`                                                 | Yes      | Human-readable name for logging                                   |
| ‐ `ApiBlock.apiPrefix`   | `string`                                                 | Yes      | Base path prefix (e.g. `/user`)                                   |
| ‐ `ApiBlock.appTypePath` | `string`                                                 | Yes      | Path to the TS file exporting `type AppType = yourRoutesVariable` |
| ‐ `ApiBlock.api`         | `Array<{ api: string; method: string; tag?: string[] }>` | No       | Methods to include; defaults to all in `AppType` if omitted       |
| `preDefineTypeContent`   | `string`                                                 | No       | Content injected at top of each generated `.d.ts` snapshot        |

---

## CLI Usage

```text
Usage: hono-docs generate --config <path> [--output <file>]

Options:
  -c, --config   Path to your config file (TS or JS)        [string] [required]
  -h, --help     Show help                                 [boolean]
```

---

## Programmatic Usage

You can use the API directly in code:

```ts
import { runGenerate, defineConfig } from "@rcmade/hono-docs";

(async () => {
  const cfg = defineConfig({
    /* ... */
  });
  await runGenerate(cfg as any);
})();
```

---

## Examples

Check out [`examples/basic-app/`](https://github.com/rcmade/hono-docs/tree/main/examples/basic-app) for a minimal setup.

---

## Development

1. Clone & install dependencies:

git clone [https://github.com/rcmade/hono-docs.git](https://github.com/rcmade/hono-docs.git)  
cd hono-docs  
pnpm install

```
2. Implement or modify code under `src/`.
3. Build and watch: pnpm build --watch
```

4. Test locally via `npm link` or `file:` install in a demo project.

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Open a PR with a clear description & tests
4. Ensure tests pass & linting is clean

---

## License

[MIT](./LICENSE)
