import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'))
for (const section of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
  for (const [name, version] of Object.entries(manifest[section] ?? {})) {
    assert(!/^(workspace:|link:|file:)/.test(version), `${name} cannot be installed from npm`)
  }
}

const [packed] = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' })
)
const files = new Set(packed.files.map(({ path }) => path))
for (const file of [
  'dist/index.mjs',
  'dist/index.d.mts',
  'dist/core/index.mjs',
  'dist/cli/index.mjs',
]) {
  assert(files.has(file), `Missing package file: ${file}`)
}
assert(
  ![...files].some((file) => /^(site|integration|packages)\//.test(file)),
  'Development files must not be published'
)
console.log(`Package checked: ${packed.filename}`)
