import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import dillonAntiSlop from '../rules/dillon-anti-slop/index.ts'
import modulePolicy from '../rules/module-policy/index.ts'
import { tanstackStartReactModulesPreset } from '../presets/index.ts'

const require = createRequire(import.meta.url)
const repository = fileURLToPath(new URL('../..', import.meta.url))

test.each([
  ['dillon-anti-slop', dillonAntiSlop],
  ['module-policy', modulePolicy],
] as const)('public %s export resolves to the built plugin and exposes all rules', (name, source) => {
  const specifier = `oxlint-plugin-arch/rules/${name}`
  const resolved = require.resolve(specifier)
  expect(resolved).toBe(fileURLToPath(new URL(`../../dist/rules/${name}/index.js`, import.meta.url)))
  expect(existsSync(resolved.replace(/\.js$/, '.d.ts'))).toBe(true)

  const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
    const { default: plugin } = await import(${JSON.stringify(specifier)});
    console.log(JSON.stringify({ name: plugin.meta.name, rules: Object.keys(plugin.rules).sort() }));
  `], { cwd: repository, encoding: 'utf8' })

  expect(JSON.parse(output)).toEqual({
    name: source.meta?.name,
    rules: Object.keys(source.rules).sort(),
  })
  expect(Object.keys(source.rules).length).toBeGreaterThan(0)
})

test('preset resolves every first-party plugin through its public export', () => {
  const config = tanstackStartReactModulesPreset({ root: repository, tailwind: false })
  for (const [name, specifier] of [
    ['arch', 'oxlint-plugin-arch'],
    ['dillon-anti-slop', 'oxlint-plugin-arch/rules/dillon-anti-slop'],
    ['modules', 'oxlint-plugin-arch/rules/module-policy'],
  ]) {
    expect(config.jsPlugins).toContainEqual({ name, specifier: require.resolve(specifier) })
  }
})
