import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, matchesGlob, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { preset, PresetError, recipes, templates } from './preset.ts'
import type { PresetFolders } from '../types/preset.types.ts'

describe('preset', () => {
  const root = resolve(import.meta.dirname, '../..')

  it.each<{ name: string; tree?: string[]; link?: boolean; folders: PresetFolders; file: string; rule: string; expected: unknown }>([
    { name: 'the TanStack recipe adds route checks', folders: { src: recipes.tanstack }, file: 'src/src/routes/index.tsx', rule: 'arch/files-route', expected: ['error', { export: 'Route' }] },
    { name: 'the Next recipe adds route checks', folders: { src: recipes.next }, file: 'src/src/app/page.tsx', rule: 'arch/files-route', expected: ['error', { export: 'default' }] },
    { name: 'the Expo recipe adds route checks', folders: { src: recipes.expo }, file: 'src/src/app/index.tsx', rule: 'arch/files-route', expected: ['error', { export: 'default' }] },
    {
      name: 'the backend recipe bans writes in query files',
      folders: { src: recipes.backend },
      file: 'src/src/services/order/order-query.list.ts',
      rule: 'arch/boundaries-deny',
      expected: ['error', { calls: { insertInto: 'Query files only read; move writes to an action.' } }],
    },
    { name: 'the library recipe adds schema checks', folders: { src: recipes.library }, file: 'src/src/a.ts', rule: 'arch/schemas-local', expected: ['error', { packages: ['zod'] }] },
    {
      name: 'the kit recipe exempts its files like components/ui',
      folders: { src: { ...recipes.kit, tailwind: { css: 'src/styles.css' } } },
      file: 'src/src/components/order/order-card.tsx',
      rule: 'arch/files-components-only',
      expected: undefined,
    },
    { name: 'the CLI recipe allows console', folders: { scripts: recipes.cli }, file: 'scripts/docs.ts', rule: 'no-console', expected: undefined },
    { name: 'an empty folder map bans console', folders: {}, file: 'src/a.ts', rule: 'no-console', expected: 'error' },
    { name: 'a nested scope changes only its folder', folders: { src: { types: true }, 'src/rules': { naming: false } }, file: 'src/rules/a.ts', rule: 'unicorn/filename-case', expected: undefined },
    { name: 'a nested scope leaves its parent alone', folders: { src: { types: true }, 'src/rules': { naming: false } }, file: 'src/a.ts', rule: 'unicorn/filename-case', expected: ['error', { case: 'kebabCase' }] },
    { name: 'a wildcard scope makes each folder a unit', folders: { 'src/*': recipes.library }, file: 'src/rules/src/a.ts', rule: 'arch/schemas-local', expected: ['error', { packages: ['zod'] }] },
    { name: 'a disabled folder is ignored', folders: { src: true, scripts: false }, file: 'scripts/docs.ts', rule: 'no-console', expected: 'ignored' },
    {
      name: 'a refining key keeps the root app a unit',
      tree: ['src/routes/', 'src/legacy/'],
      folders: { '.': { react: true, tanstack: true }, 'src/legacy': { severity: 'warn' } },
      file: 'src/routes/index.tsx',
      rule: 'arch/files-route',
      expected: ['error', { export: 'Route' }],
    },
    {
      name: 'a CLI key beside a root app keeps the root app',
      tree: ['src/routes/', 'scripts/'],
      folders: { '.': { react: true, tanstack: true }, scripts: { console: true } },
      file: 'src/routes/index.tsx',
      rule: 'arch/files-route',
      expected: ['error', { export: 'Route' }],
    },
    {
      name: 'a CLI key beside a root app is a CLI, not an app',
      tree: ['src/routes/', 'scripts/'],
      folders: { '.': { react: true, tanstack: true }, scripts: { console: true } },
      file: 'scripts/src/routes/index.tsx',
      rule: 'arch/files-route',
      expected: undefined,
    },
    {
      name: 'each app gets its own import aliases',
      tree: ['apps/web/src/', 'apps/admin/src/'],
      folders: { 'apps/web': { imports: { aliases: { '@/': 'apps/web/src' } } }, 'apps/admin': { imports: { aliases: { '@/': 'apps/admin/src' } } } },
      file: 'apps/web/src/a.ts',
      rule: 'arch/boundaries-imports',
      expected: ['error', { aliases: { '@': expect.stringMatching(/apps\/web\/src$/) } }],
    },
    {
      name: 'a framework rule gets its own app aliases',
      tree: ['apps/web/src/', 'apps/admin/src/'],
      folders: {
        'apps/web': { react: true, tanstack: true, imports: { aliases: { '@/': 'apps/web/src' } } },
        'apps/admin': { react: true, tanstack: true, imports: { aliases: { '@/': 'apps/admin/src' } } },
      },
      file: 'apps/web/src/services/a.ts',
      rule: 'arch/boundaries-tanstack',
      expected: ['error', { aliases: { '@': expect.stringMatching(/apps\/web\/src$/) } }],
    },
    { name: 'folder severity applies to common rules', tree: ['apps/web/'], folders: { 'apps/web': { severity: 'warn' } }, file: 'apps/web/a.ts', rule: 'eqeqeq', expected: 'warn' },
    { name: 'common rules outside the folder keep the root level', tree: ['apps/web/'], folders: { 'apps/web': { severity: 'warn' } }, file: 'a.ts', rule: 'eqeqeq', expected: 'error' },
    { name: 'console inherits the root severity', tree: ['apps/web/'], folders: { '.': { severity: 'warn' }, 'apps/web': true }, file: 'apps/web/a.ts', rule: 'no-console', expected: 'warn' },
    {
      name: 'an exact key beats a disabled wildcard',
      tree: ['packages/ui/', 'packages/old/'],
      folders: { 'packages/*': false, 'packages/ui': { schemas: true } },
      file: 'packages/ui/src/a.ts',
      rule: 'eqeqeq',
      expected: 'error',
    },
    { name: 'a disabled wildcard ignores the other folders', tree: ['packages/ui/', 'packages/old/'], folders: { 'packages/*': false, 'packages/ui': true }, file: 'packages/old/a.ts', rule: 'eqeqeq', expected: 'ignored' },
    {
      name: 'a folder sets its own import sort internal patterns',
      folders: { src: { imports: { internal: ['^~/'] } } },
      file: 'src/a.ts',
      rule: 'perfectionist/sort-imports',
      expected: ['error', { internalPattern: ['^~/'] }],
    },
    {
      name: 'a folder file pattern adds to the strict layout check',
      tree: ['apps/server/src/services/order/'],
      folders: { 'apps/server': { backend: true, layout: { strict: true } }, 'apps/server/src/services/order': { naming: { files: '^order' } } },
      file: 'apps/server/src/services/order/order.foo.ts',
      rule: 'arch/naming-file',
      expected: ['error', { message: expect.stringMatching(/^Domain files/) }, { pattern: '^order' }],
    },
    {
      name: 'a symlinked root resolves to its real path',
      tree: ['apps/web/src/'],
      link: true,
      folders: { 'apps/web': true },
      file: 'apps/web/src/a.ts',
      rule: 'arch/boundaries-imports',
      expected: ['error', { packages: [expect.not.stringContaining('-link')] }],
    },
  ])('$name', ({ tree, link, folders, file, rule, expected }) => {
    const base = tree ? mkdtempSync(join(tmpdir(), 'arch-preset-')) : root
    const linked = `${base}-link`

    try {
      for (const path of tree ?? []) {
        mkdirSync(join(base, path), { recursive: true })
      }

      if (link) {
        symlinkSync(base, linked)
      }

      const config = preset({ root: link ? linked : base, folders })
      const matches = (globs: string[] | undefined) => (globs ?? []).some((glob) => matchesGlob(file, glob))
      const rules = { ...config.rules }

      for (const override of config.overrides ?? []) {
        if (matches(override.files) && !matches(override.excludeFiles)) {
          Object.assign(rules, override.rules)
        }
      }

      expect({ value: matches(config.ignorePatterns) ? 'ignored' : rules[rule] }).toMatchObject({ value: expected })
    } finally {
      if (tree) {
        rmSync(base, { recursive: true, force: true })
        rmSync(linked, { force: true })
      }
    }
  })

  it.each([
    { name: 'layout', options: { services: 'flat', hooks: false, suffixes: ['adapter'] } },
    { name: 'limits', options: { lines: 200, types: 500, complexity: 16 } },
    { name: 'style', options: { quotes: 'double', semicolons: false } },
    { name: 'basics', options: { trivial: false, state: false } },
    { name: 'naming', options: { files: '^[a-z]', exports: false } },
    { name: 'comments', options: { directives: false } },
    { name: 'types', options: { safety: false, colocated: ['src/routes/**'] } },
    { name: 'imports', options: { sort: false, aliases: { '@/': 'src' } } },
    { name: 'tests', options: { assertions: ['assert.ok'], functions: ['scenario'], mocking: 'strict' } },
    { name: 'react', options: { a11y: false, effects: false, compiler: false } },
    { name: 'tanstack', options: { server: ['server-only'], client: ['client-only'] } },
    { name: 'next', options: { server: ['server-only'], dynamic: ['src/routes'] } },
    { name: 'expo', options: { server: ['node:fs'] } },
    { name: 'tailwind', options: { css: 'src/styles.css', rem: 14 } },
    { name: 'shadcn', options: { ui: '@/ui', components: ['^@/ui/'] } },
    { name: 'kit', options: {} },
    { name: 'backend', options: { exports: ['@example/api/client'], registry: 'src/registry.ts' } },
    { name: 'orpc', options: { public: ['publicProcedure'], composers: ['compose'], client: 'src/client.ts' } },
    { name: 'schemas', options: {} },
    { name: 'forms', options: { resolver: 'schemaResolver' } },
    { name: 'sql', options: { sanitizers: ['escapeSearch'] } },
    { name: 'console', options: {} },
    { name: 'deny', options: { imports: { legacy: 'Use the owner API.' }, calls: { 'legacy.run': 'Use the owner API.' } } },
    { name: 'externals', options: { packages: ['native-addon'] } },
  ])('$name accepts switches and options', ({ name, options }) => {
    for (const value of [true, false, 'warn', options]) {
      expect(() => preset({ root, folders: { src: { [name]: value } } })).not.toThrow()
    }
  })

  it.each<{ name: string; folders: unknown; message: string }>([
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
    { name: 'a null group value fails', folders: { src: { react: null } }, message: "Group `react` takes true, false, 'warn' or an options object." },
    { name: 'an array group value fails', folders: { src: { layout: [] } }, message: "Group `layout` takes true, false, 'warn' or an options object." },
    { name: 'expo has no client option', folders: { src: { expo: { client: ['client-only'] } } }, message: 'Unknown option `expo.client`.' },
    { name: 'a group level cannot be set directly', folders: { src: { layout: { level: 'warn' } } }, message: 'Unknown option `layout.level`.' },
    { name: 'a bad severity fails', folders: { src: { severity: 'off' } }, message: "Folder `src` severity must be 'error' or 'warn'." },
    { name: 'an escaping source fails', folders: { src: { source: '../' } }, message: 'Folder `src` source must be `.` or a literal relative path.' },
    { name: 'two frameworks fail', folders: { src: { next: true, expo: true } }, message: 'Folder `src` enables more than one of tanstack, next and expo.' },
    {
      name: 'an app cannot also be a backend',
      folders: { src: { next: true, backend: true } },
      message: 'Folder `src` is either an app (tanstack, next, expo) or a backend, not both.',
    },
    { name: 'a key inside a skipped folder fails', folders: { src: false, 'src/rules': true }, message: 'Folder `src/rules` sits inside the skipped folder `src`.' },
    { name: 'an invalid file regex fails', folders: { src: { naming: { files: '[' } } }, message: 'naming.files must be a valid regular expression.' },
    { name: 'an invalid export regex fails', folders: { src: { naming: { exports: '[' } } }, message: 'naming.exports must be a valid regular expression.' },
    { name: 'an invalid uniqueness regex fails', folders: { src: { naming: { unique: '[' } } }, message: 'naming.unique must be a valid regular expression.' },
    {
      name: 'operations cannot be set below an app folder',
      folders: { src: { next: true }, 'src/rules': { layout: { operations: 'folders' } } },
      message: 'Set layout.operations on an app or package folder, not on `src/rules`.',
    },
    {
      name: 'query writes cannot be set below a backend folder',
      folders: { src: { backend: true }, 'src/rules': { backend: { writes: ['dispatch'] } } },
      message: 'Set backend.writes on a backend folder, not on `src/rules`.',
    },
    { name: 'an invalid suffix fails', folders: { src: { layout: { suffixes: ['Bad'] } } }, message: 'Layout suffixes must be lowercase kebab-case names.' },
    {
      name: 'a built-in suffix cannot be replaced',
      folders: { src: { layout: { suffixes: ['service'] } } },
      message: 'Layout suffixes must not replace built-in file roles.',
    },
    { name: 'a kit without a stylesheet fails', folders: { src: recipes.kit }, message: 'The UI kit src needs a Tailwind stylesheet: set tailwind.css on it.' },
    {
      name: 'folders that disagree on tailwind.rem fail',
      folders: { src: { tailwind: { rem: 10 } }, scripts: { tailwind: { rem: 16 } } },
      message: 'tailwind.rem is project-wide: set the same value in every folder, or set it once on `.`.',
    },
    {
      name: 'folders that disagree on shadcn.ui fail',
      folders: { src: { shadcn: { ui: '@acme/ui' } }, scripts: { shadcn: true } },
      message: 'shadcn.ui and shadcn.components are project-wide: set the same values in every folder, or set them once on `.`.',
    },
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
    // SAFETY: these rows hold invalid folder maps on purpose; preset() validates its input at runtime.
    expect(() => preset({ root, folders: folders as PresetFolders })).toThrow(new PresetError(message))
  })
})
