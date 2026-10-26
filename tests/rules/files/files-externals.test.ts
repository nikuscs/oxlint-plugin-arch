import { describe, it } from 'vitest'
import { filesExternals } from '../../../src/rules/files/files-externals.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/files-externals', () => {
  it.each([
    {
      name: 'a declared external passes',
      filename: 'vite.config.ts',
      files: { 'package.json': '{ "dependencies": { "pg": "^8" } }' },
      code: "export default defineConfig({ ssr: { external: ['pg'] } })",
    },
    {
      name: 'builtins and subpaths pass',
      filename: 'vite.config.ts',
      files: { 'package.json': '{ "dependencies": { "pg": "^8" } }' },
      code: "export default defineConfig({ ssr: { external: ['fs', 'node:path', 'bun:sqlite', 'pg/native'] } })",
    },
    {
      name: 'an optional scoped dependency passes',
      filename: 'next.config.ts',
      files: { 'package.json': '{ "optionalDependencies": { "@napi-rs/canvas": "^1" } }' },
      code: "export default { serverExternalPackages: ['@napi-rs/canvas'] }",
    },
    {
      name: 'the nearest package.json is read',
      filename: 'apps/server/vite.config.ts',
      files: { 'package.json': '{ "dependencies": {} }', 'apps/server/package.json': '{ "dependencies": { "pg": "^8" } }' },
      code: "export default defineConfig({ ssr: { external: ['pg'] } })",
    },
    {
      name: 'a config without package.json is skipped',
      filename: 'vite.config.ts',
      files: {},
      code: "export default defineConfig({ ssr: { external: ['stripe'] } })",
    },
    {
      name: 'other files are skipped',
      filename: 'app.config.ts',
      files: { 'package.json': '{ "dependencies": { "pg": "^8" } }' },
      code: "export default defineConfig({ ssr: { external: ['stripe'] } })",
    },
    {
      name: 'a dependency outside packages may be bundled',
      filename: 'vite.config.ts',
      files: { 'package.json': '{ "dependencies": { "pg": "^8", "zod": "^4" } }' },
      code: "export default defineConfig({ ssr: { external: ['pg'] } })",
      options: { packages: ['pg', 'sharp'] },
    },
    {
      name: 'a dynamic list skips the packages check',
      filename: 'vite.config.ts',
      files: { 'package.json': '{ "dependencies": { "pg": "^8" } }' },
      code: 'export default defineConfig({ ssr: { external: [...base] } })',
      options: { packages: ['pg'] },
    },
    {
      name: 'a config without a list skips the packages check',
      filename: 'vite.config.ts',
      files: { 'package.json': '{ "dependencies": { "pg": "^8" } }' },
      code: 'export default defineConfig({ ssr: {} })',
      options: { packages: ['pg'] },
    },
    {
      name: 'an undeclared vite external',
      filename: 'vite.config.ts',
      files: { 'package.json': '{ "dependencies": { "pg": "^8" } }' },
      code: "export default defineConfig({ ssr: { external: ['stripe'] } })",
      errors: ['undeclared'],
    },
    {
      name: 'an undeclared next external',
      filename: 'next.config.mjs',
      files: { 'package.json': '{ "dependencies": { "pg": "^8" } }' },
      code: "export default { serverExternalPackages: ['stripe'] }",
      errors: ['undeclared'],
    },
    {
      name: 'a dev dependency is undeclared',
      filename: 'vite.config.ts',
      files: { 'package.json': '{ "devDependencies": { "pg": "^8" } }' },
      code: "export default defineConfig({ ssr: { external: ['pg'] } })",
      errors: ['undeclared'],
    },
    {
      name: 'a dynamic list still checks its literals',
      filename: 'vite.config.ts',
      files: { 'package.json': '{ "dependencies": { "pg": "^8" } }' },
      code: "export default defineConfig({ ssr: { external: [...base, 'stripe'] } })",
      options: { packages: ['pg'] },
      errors: ['undeclared'],
    },
    {
      name: 'a missing package',
      filename: 'vite.config.ts',
      files: { 'package.json': '{ "dependencies": { "pg": "^8", "sharp": "^0" } }' },
      code: "export default defineConfig({ ssr: { external: ['pg'] } })",
      options: { packages: ['pg', 'sharp'] },
      errors: ['missing'],
    },
    {
      name: 'a glob matches one segment',
      filename: 'next.config.ts',
      files: { 'package.json': '{ "dependencies": { "@napi-rs/canvas": "^1", "@napi-rs/image": "^1" } }' },
      code: 'export default { serverExternalPackages: [] }',
      options: { packages: ['@napi-rs/*'] },
      errors: ['missing', 'missing'],
    },
  ])('$name', (row) => testerRun(filesExternals, row))
})
