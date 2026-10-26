import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { preset, PresetError, recipes, templates } from './preset.ts'
import type { PresetFolders } from '../types/preset.types.ts'

describe('preset', () => {
  it.each<[string, PresetFolders]>([
    ['the TanStack recipe resolves', { src: recipes.tanstack }],
    ['the Next recipe resolves', { src: recipes.next }],
    ['the Expo recipe resolves', { src: recipes.expo }],
    ['the backend recipe resolves', { src: recipes.backend }],
    ['the library recipe resolves', { src: recipes.library }],
    ['the kit recipe resolves with a stylesheet', { src: { ...recipes.kit, tailwind: { css: 'src/styles.css' } } }],
    ['the CLI recipe resolves', { scripts: recipes.cli }],
    ['an empty folder map resolves', {}],
    ['a nested scope inherits its parent', { src: { types: true }, 'src/rules': { naming: false } }],
    ['a wildcard scope resolves existing folders', { 'src/*': recipes.library }],
    ['a disabled folder resolves', { src: true, scripts: false }],
  ])('%s', (_, folders) => {
    expect(preset({ root: resolve(import.meta.dirname, '../..'), folders })).toMatchObject({
      options: { typeAware: true },
      categories: { correctness: 'error' },
      rules: { 'no-empty': 'error' },
      overrides: expect.any(Array),
    })
  })

  it.each([
    { group: 'layout', options: { services: 'flat', hooks: false, suffixes: ['adapter'] } },
    { group: 'limits', options: { lines: 200, types: 500, complexity: 16 } },
    { group: 'style', options: { quotes: 'double', semicolons: false } },
    { group: 'basics', options: { trivial: false, state: false } },
    { group: 'naming', options: { files: '^[a-z]', exports: false } },
    { group: 'comments', options: { directives: false } },
    { group: 'types', options: { safety: false, colocated: ['src/routes/**'] } },
    { group: 'imports', options: { sort: false, aliases: { '@/': 'src' } } },
    { group: 'tests', options: { assertions: ['assert.ok'], functions: ['scenario'], mocking: 'strict' } },
    { group: 'react', options: { a11y: false, effects: false, compiler: false } },
    { group: 'tanstack', options: { server: ['server-only'], client: ['client-only'] } },
    { group: 'next', options: { server: ['server-only'], dynamic: ['src/routes'] } },
    { group: 'expo', options: { client: ['client-only'], dynamic: ['src/routes'] } },
    { group: 'tailwind', options: { css: 'src/styles.css', rem: 14 } },
    { group: 'shadcn', options: { ui: '@/ui', components: ['^@/ui/'] } },
    { group: 'kit', options: {} },
    { group: 'backend', options: { exports: ['@example/api/client'], registry: 'src/registry.ts' } },
    { group: 'orpc', options: { public: ['publicProcedure'], composers: ['compose'], client: 'src/client.ts' } },
    { group: 'schemas', options: {} },
    { group: 'forms', options: { resolver: 'schemaResolver' } },
    { group: 'sql', options: { sanitizers: ['escapeSearch'] } },
    { group: 'console', options: {} },
    { group: 'deny', options: { imports: { legacy: 'Use the owner API.' }, calls: { 'legacy.run': 'Use the owner API.' } } },
    { group: 'externals', options: { packages: ['native-addon'] } },
  ])('$group accepts switches and options', ({ group, options }) => {
    expect(() => preset({ root: resolve(import.meta.dirname, '../..'), folders: { src: { [group]: true } } })).not.toThrow()
    expect(() => preset({ root: resolve(import.meta.dirname, '../..'), folders: { src: { [group]: false } } })).not.toThrow()
    expect(() => preset({ root: resolve(import.meta.dirname, '../..'), folders: { src: { [group]: 'warn' } } })).not.toThrow()
    expect(() => preset({ root: resolve(import.meta.dirname, '../..'), folders: { src: { [group]: options } } })).not.toThrow()
  })

  it.each([
    { name: 'the monorepo template requires its folders', folders: templates.monorepo, message: 'Folder `apps/web` does not exist.' },
    { name: 'a missing folder fails', folders: { 'missing-preset-folder': true }, message: 'Folder `missing-preset-folder` does not exist.' },
    { name: 'an absolute folder key fails', folders: { '/src': true }, message: 'Folder keys must be project-relative paths: /src' },
    { name: 'an empty folder key fails', folders: { '': true }, message: 'Folder keys must be project-relative paths: ' },
    { name: 'an escaping folder key fails', folders: { '../src': true }, message: 'Folder keys must stay inside the project: ../src' },
    {
      name: 'a partial wildcard fails',
      folders: { 'src/rule*': true },
      message: 'Folder keys must be literal paths; only a whole `*` segment may be a wildcard: src/rule*',
    },
    { name: 'a nonfinal wildcard fails', folders: { 'src/*/rules': true }, message: 'Only the last segment of a folder key may be `*`: src/*/rules' },
    { name: 'normalized duplicate folders fail', folders: { src: true, 'src/': true }, message: 'Folder `src` is listed twice.' },
    { name: 'an invalid folder value fails', folders: { src: 42 }, message: 'Folder `src` takes true, false or an object.' },
    { name: 'an unknown folder option fails', folders: { src: { typo: true } }, message: 'Unknown folder option `typo` in `src`.' },
    { name: 'an unknown group option fails', folders: { src: { layout: { typo: true } } }, message: 'Unknown option `layout.typo`.' },
    { name: 'a group level cannot be set directly', folders: { src: { layout: { level: 'warn' } } }, message: 'Unknown option `layout.level`.' },
    { name: 'a bad severity fails', folders: { src: { severity: 'off' } }, message: "Folder `src` severity must be 'error' or 'warn'." },
    { name: 'an escaping source fails', folders: { src: { source: '../' } }, message: 'Folder `src` source must be `.` or a literal relative path.' },
    { name: 'two frameworks fail', folders: { src: { next: true, expo: true } }, message: 'Folder `src` enables more than one of tanstack, next and expo.' },
    {
      name: 'an app cannot also be a backend',
      folders: { src: { next: true, backend: true } },
      message: 'Folder `src` is either an app (tanstack, next, expo) or a backend, not both.',
    },
    { name: 'an invalid file regex fails', folders: { src: { naming: { files: '[' } } }, message: 'naming.files must be a valid regular expression.' },
    { name: 'an invalid export regex fails', folders: { src: { naming: { exports: '[' } } }, message: 'naming.exports must be a valid regular expression.' },
    { name: 'an invalid uniqueness regex fails', folders: { src: { naming: { unique: '[' } } }, message: 'naming.unique must be a valid regular expression.' },
    {
      name: 'operations cannot be set below an app folder',
      folders: { src: { next: true }, 'src/rules': { layout: { operations: 'folders' } } },
      message: 'Set layout.operations on an app or package folder, not on `src/rules`.',
    },
    { name: 'an invalid suffix fails', folders: { src: { layout: { suffixes: ['Bad'] } } }, message: 'Layout suffixes must be lowercase kebab-case names.' },
    {
      name: 'a built-in suffix cannot be replaced',
      folders: { src: { layout: { suffixes: ['service'] } } },
      message: 'Layout suffixes must not replace built-in file roles.',
    },
    { name: 'a kit without a stylesheet fails', folders: { src: recipes.kit }, message: 'The UI kit src needs a Tailwind stylesheet: set tailwind.css on it.' },
    {
      name: 'a nonstring deny import fails',
      folders: { src: { deny: { imports: { legacy: 1 } } } },
      message: 'Deny entry `legacy` takes a message string or false.',
    },
    { name: 'a nonstring deny call fails', folders: { src: { deny: { calls: { run: true } } } }, message: 'Deny entry `run` takes a message string or false.' },
    {
      name: 'a registry outside the backend fails',
      folders: { src: { backend: { registry: 'scripts/registry.ts' } } },
      message: 'backend.registry `scripts/registry.ts` must be a project-relative path inside a backend folder.',
    },
    {
      name: 'an invalid test function fails',
      folders: { src: { tests: { functions: ['test.*'] } } },
      message: 'Test functions must be literal identifiers or dotted names.',
    },
    {
      name: 'an unrooted assertion pattern fails',
      folders: { src: { tests: { assertions: ['*.assert'] } } },
      message: 'Assertion functions must be rooted dotted names or patterns.',
    },
    { name: 'an unknown mocking preset fails', folders: { src: { tests: { mocking: 'other' } } }, message: 'Unknown test mocking preset.' },
  ])('$name', ({ folders, message }) => {
    expect(() => preset({ root: resolve(import.meta.dirname, '../..'), folders: JSON.parse(JSON.stringify(folders)) })).toThrow(new PresetError(message))
  })
})
