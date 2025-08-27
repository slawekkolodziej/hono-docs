# Agent Guidelines for hono-docs

## Build/Lint/Test Commands
- **Build**: `pnpm run build` (tsup builds to dist/)
- **Lint**: `pnpm run lint` (ESLint with TypeScript)
- **Test**: No test framework configured
- **Pre-commit**: Automatically runs lint and build

## Code Style Guidelines
- **Language**: TypeScript with strict mode enabled
- **Modules**: ES modules (`type: "module"`)
- **Target**: ES2020, module ESNext
- **Imports**: Use ES module imports
- **Formatting**: ESLint with Prettier config
- **Brace Style**: 1tbs with single-line allowed
- **Error Handling**: try-catch with console.error, process.exit(1) in CLI
- **Types**: Generate declaration files (.d.ts)
- **Build Tool**: tsup with sourcemaps and DTS generation
- **External Dependencies**: esbuild-register, ts-morph, yargs

## Project Structure
- `src/` contains source code
- `dist/` contains built output
- `examples/` contains example applications
- Use barrel exports (index.ts files) for clean imports