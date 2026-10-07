import { afterAll, describe, expect, test } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  realpathSync,
  readFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PresetArchitecture } from '../types/preset.types.ts'
import type { PresetFixtureOutput } from './types/preset-fixture.types.ts'
import { tanstackStartReactModulesPreset } from '../presets/index.ts'

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const temporary = realpathSync(mkdtempSync(resolve(tmpdir(), 'arch-preset-')))
const binary = resolve(repository, 'node_modules/oxlint/bin/oxlint')
let sequence = 0

afterAll(() => rmSync(temporary, { recursive: true, force: true }))

function fixture(options: string, files: Record<string, string>, print = false) {
  const root = resolve(temporary, String(sequence++))
  mkdirSync(root)
  symlinkSync(resolve(repository, 'node_modules'), resolve(root, 'node_modules'), 'dir')
  const allFiles = {
    'package.json': JSON.stringify({ name: '@fixture/workspace', private: true, type: 'module' }),
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        strict: true,
        target: 'ESNext',
        module: 'Preserve',
        moduleResolution: 'Bundler',
        jsx: 'react-jsx',
        skipLibCheck: true,
      },
      include: ['**/*.ts', '**/*.tsx'],
    }),
    'apps/server/package.json': JSON.stringify({
      name: '@fixture/server',
      type: 'module',
    }),
    'oxlint.config.ts': `import preset from ${JSON.stringify(resolve(repository, 'dist/presets/tanstack-start-react-modules-preset.js'))};\nexport default preset({ root: import.meta.dirname, tailwind: false, ${options} });\n`,
    ...files,
  }
  for (const [path, code] of Object.entries(allFiles)) {
    const destination = resolve(root, path)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, code)
  }
  const result = spawnSync(
    process.execPath,
    [
      binary,
      '-c',
      resolve(root, 'oxlint.config.ts'),
      ...(print
        ? ['--print-config']
        : ['--format', 'json', ...Object.keys(files).filter((file) => /\.[cm]?tsx?$/.test(file))]),
    ],
    { cwd: root, encoding: 'utf8', timeout: 30_000 },
  )
  if (result.error) throw result.error
  if (result.stderr.includes('Failed to') || result.stdout.startsWith('Failed to'))
    throw new Error(result.stdout + result.stderr)
  return { status: result.status, output: result.stdout + result.stderr, root }
}

describe('TanStack Start React modules preset', { timeout: 30_000 }, () => {
  test.each(['standard', 'fixtures'])('test profile %s follows assertion callbacks in table rows', (profile) => {
    const code = `test.for([
  { value: 1, verify: (value: number) => { expect(value).toBe(1); } },
  { value: 2, verify: (value: number) => { expect(value).toBe(2); } },
] as const)('checks $value', ({ value, verify: check }) => { check(value); });\n`
    const result = fixture(`tests: { profile: '${profile}' },`, {
      'apps/server/tests/native-table.test.ts': "import { expect, test } from 'vitest';\n" + code,
      'apps/server/tests/fixture-table.test.ts': "import { expect, test as base } from 'vitest';\nconst test = base.extend({ amount: 1 });\n" + code,
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(output.diagnostics.filter((entry) => /vitest\(|test-assertions/.test(entry.code)), result.output).toEqual([])
  })

  test.each(['standard', 'fixtures'])(
    'test profile %s recognizes fixture tables and narrowing assertions',
    (profile) => {
      const result = fixture(
        `tests: { profile: '${profile}', additionalTestFunctions: ['integrationTest'] },`,
        {
          'tsconfig.json': JSON.stringify({
            compilerOptions: {
              strict: true,
              skipLibCheck: true,
              module: 'Preserve',
              moduleResolution: 'Bundler',
              target: 'ESNext',
              types: ['node'],
            },
            include: ['apps/**/*.ts'],
          }),
          'apps/server/tests/order.test.ts': `import { assert, expect, test as base } from 'vitest';
const test = base.extend<{ amount: number }>({ amount: 1 });
const integrationTest = test;
test.for([1, 2])('table %s', (amount, { expect }) => { expect(amount).toBeGreaterThan(0); });
test.each([1, 2])('each %s', (amount) => { expect(amount).toBeGreaterThan(0); });
integrationTest.for([1])('custom table %s', (amount) => { expect(amount).toBe(1); });
test.concurrent.for([1])('concurrent table %s', (amount, { expect }) => { expect(amount).toBe(1); });
integrationTest('custom assertion', ({ amount }) => { assert.isTrue(amount === 1); });
test('narrows a result', () => {
  const result: { ok: true; data: { count: number } } | { ok: false } = Math.random() > 0.5 ? { ok: true, data: { count: 1 } } : { ok: false };
  assert(result.ok, 'Expected success');
  expect(result.data.count).toBe(1);
});
test('assert only', () => { assert(true); });
`,
      'apps/server/tests/native.test.ts': `import { assert, expect, it, test } from 'vitest';
test.for([1])('native for %s', (amount) => { expect(amount).toBe(1); });
it.each([1])('native each %s', (amount) => { expect(amount).toBe(1); });
test('native assert', () => { assert(true); });
test('poll', async () => { await expect.poll(() => 1).toBe(1); });
`,
        },
      )
      const diagnostics: PresetFixtureOutput = JSON.parse(result.output)
      expect(diagnostics.diagnostics.filter((entry) => entry.code.startsWith('vitest('))).toEqual([])
      const checked = spawnSync(
        process.execPath,
        [resolve(repository, 'node_modules/typescript/bin/tsc'), '--noEmit'],
        {
          cwd: result.root,
          encoding: 'utf8',
          timeout: 30_000,
        },
      )
      expect(checked.status, checked.stdout + checked.stderr).toBe(0)
    },
  )

  test.each(['standard', 'fixtures'])('test profile %s retains assertion and mock safety', (profile) => {
    const result = fixture(
      `tests: { profile: '${profile}', additionalTestFunctions: ['integrationTest'] },`,
      {
        'apps/server/tests/order.test.ts': `import { expect, test as base, vi } from 'vitest';
const test = base.extend<{ amount: number }>({ amount: 1 });
const integrationTest = test;
expect(1).toBe(1);
test('conditional assertion', ({ amount }) => { if (amount) { expect(amount).toBe(1); } });
integrationTest.only('focused', () => { expect(1).toBe(1); });
integrationTest.skip('skipped', () => { expect(1).toBe(1); });
integrationTest.todo('future');
vi.mock('./dependency');
const callback = vi.fn();
let shared = 1;
test('mock', () => { shared += 1; expect(callback).not.toHaveBeenCalled(); });
`,
      'apps/server/tests/empty.test.ts': `import { test as base } from 'vitest';
const test = base.extend<{ amount: number }>({ amount: 1 });
const integrationTest = test;
test.for([1])('missing assertion %s', (amount) => { Math.abs(amount); });
integrationTest.for([1])('custom missing assertion %s', (amount) => { Math.abs(amount); });
`,
      'apps/server/tests/native-empty.test.ts': "import { test } from 'vitest';\ntest.for([1])('native empty %s', (amount) => { Math.abs(amount); });\n",
      },
    )
    const diagnostics: PresetFixtureOutput = JSON.parse(result.output)
    const codes = diagnostics.diagnostics.map((entry) => entry.code)
    expect(codes.filter((code) => code === 'vitest(expect-expect)'), result.output).toHaveLength(0)
    expect(
      codes.filter((code) => code === 'modules(test-assertions)'),
      result.output,
    ).toHaveLength(4)
    expect(codes.filter((code) => code === 'modules(test-modifiers)')).toHaveLength(3)
    expect(codes).toEqual(
      expect.arrayContaining([
        'modules(test-assertions)',
        'vitest(no-conditional-expect)',
        'vitest(require-mock-type-parameters)',
        'dillon-anti-slop(no-module-mocking)',
        'arch(no-module-mutable-state)',
      ]),
    )
  })

  test('fixture profile preserves support imports convention while standard leaves helper organization open', () => {
    const files = {
      'apps/server/tests/order.test.ts':
        "import { expect, test } from 'vitest';\nimport { amount } from './helpers/amount';\ntest('amount', () => { expect(amount).toBe(1); });\n",
      'apps/server/tests/helpers/amount.ts': 'export const amount = 1;\n',
    }
    for (const options of ['', "tests: { profile: 'fixtures' },", "tests: { profile: 'standard' },"]) {
      const result = fixture(options, files)
      const diagnostics: PresetFixtureOutput = JSON.parse(result.output)
      const restricted = diagnostics.diagnostics.filter(
        (entry) => entry.code === 'eslint(no-restricted-imports)',
      )
      expect(restricted).toHaveLength(options.includes('standard') ? 0 : 1)
    }
  })

  test('test settings validate names and preserve callbacks, severity, exclusions and caller arrays', () => {
    const additionalTestFunctions = ['integrationTest']
    const config = tanstackStartReactModulesPreset({
      tests: { additionalTestFunctions },
      severity: 'warn',
      policies: {
        tests: (current) => [
          ...current,
          { files: ['**/*.test.ts'], rules: { 'vitest/no-conditional-expect': 'off' } },
        ],
      },
      ruleExclusions: { 'modules/test-assertions': ['tests/special.test.ts'] },
    })
    expect(additionalTestFunctions).toEqual(['integrationTest'])
    expect(
      config.overrides?.some((entry) => {
        const rule = entry.rules?.['modules/test-assertions']
        return Array.isArray(rule) && rule[0] === 'warn'
      }),
    ).toBe(true)
    expect(config.overrides?.at(-1)?.rules?.['modules/test-assertions']).toBe('off')
    expect(() => fixture("tests: { profile: 'unknown' },", { 'tests/order.test.ts': '' })).toThrow()
    expect(() => tanstackStartReactModulesPreset({ tests: { additionalTestFunctions: ['*'] } })).toThrow(
      'literal identifiers',
    )
  })

  test('registered imported assertion helpers are exact and additive to Vitest assertions', () => {
    const files = {
      'apps/server/tests/order.test.ts':
        "import { assert, test } from 'vitest';\nimport { verifyOrder, verifyOther } from './support/assertions';\ntest('known helper', () => { verifyOrder(1); });\ntest('unregistered helper', () => { verifyOther(1); });\ntest('native assertion', () => { assert.isTrue(true); });\n",
      'apps/server/tests/support/assertions.ts':
        "import { expect } from 'vitest';\nexport function verifyOrder(value: number) { expect(value).toBe(1); }\nexport function verifyOther(value: number) { expect(value).toBe(1); }\n",
    }
    const result = fixture("tests: { additionalAssertionFunctions: ['verifyOrder'] },", files)
    const diagnostics: PresetFixtureOutput = JSON.parse(result.output)
    expect(diagnostics.diagnostics.filter((entry) => entry.code === 'modules(test-assertions)')).toHaveLength(1)
  })

  test('explicit migration files exempt service layout and functions without hiding safety or nearby services', () => {
    const path = 'api/src/services/database/migrations/001-create.ts'
    const files = {
      [path]:
        'export function up() { return 1; }\nexport function down() { return 0; }\nexport type Unsafe = unknown;\n',
      'api/src/services/database/tasks/001-create.ts':
        'export function up() { return 1; }\nexport function down() { return 0; }\n',
      'worker/src/services/database/migrations/001-create.ts':
        'export function up() { return 1; }\nexport function down() { return 0; }\n',
    }
    const options = "architecture: { api: 'server', worker: 'runner' },"
    const baseline: PresetFixtureOutput = JSON.parse(fixture(options, files).output)
    expect(
      baseline.diagnostics.some(
        (entry) => entry.filename === path && entry.code === 'modules(service-functions)',
      ),
    ).toBe(true)
    const result = fixture(
      options + "modules: { migrationFiles: ['api/src/services/database/migrations/*.ts'] },",
      files,
    )
    const diagnostics: PresetFixtureOutput = JSON.parse(result.output)
    const migrated = diagnostics.diagnostics
      .filter((entry) => entry.filename === path)
      .map((entry) => entry.code)
    expect(migrated).not.toContain('arch(no-restricted-files)')
    expect(migrated).not.toContain('modules(service-functions)')
    expect(migrated).toContain('modules(no-unknown)')
    for (const filename of Object.keys(files).slice(1)) {
      const codes = diagnostics.diagnostics
        .filter((entry) => entry.filename === filename)
        .map((entry) => entry.code)
      expect(codes).toEqual(
        expect.arrayContaining(['arch(no-restricted-files)', 'modules(service-functions)']),
      )
    }
  })

  test('grouped settings preserve rule options, root-specific paths and callback precedence', () => {
    const seen: string[] = []
    const config = tanstackStartReactModulesPreset({
      root: '/fixture',
      architecture: { dashboard: { role: 'web', layout: { services: 'flat' } }, storefront: 'web', api: 'server' },
      severity: 'warn',
      limits: { maxFileLines: 123, maxFunctionComplexity: 17 },
      modules: { customFileRoles: ['prompts'] },
      imports: {
        backendEntryPoints: ['@company/api/client'],
        aliases: { '@api': 'api/src' },
        internalSortPatterns: ['^@company/'],
      },
      orpc: {
        publicProcedureFiles: ['api/src/rpc/public/**'],
        outputSchemaComposers: ['paged'],
        clientOwnerFile: 'dashboard/src/services/bridge.client.ts',
      },
      sql: { likeSanitizers: ['escapePattern'] },
      forms: { schemaResolver: 'customResolver' },
      react: { compiler: false },
      tanstackStart: {
        additionalServerOnlyImports: ['private-db'],
        additionalClientOnlyImports: ['browser-sdk'],
        computedImportAllowedFiles: ['dashboard/src/services/loader.server.ts'],
      },
      tailwind: { cssEntryPoint: 'theme.css', cssEntryPointsByRoot: { storefront: 'store.css' }, rootFontSize: 18 },
      shadcn: { uiImportPath: '@ui', componentImportSources: ['^@company/ui'] },
      policies: {
        imports: (current) => {
          seen.push('imports')
          return [...current, { files: ['dashboard/**/*.ts'], rules: { 'no-console': 'error', 'no-debugger': 'off' } }]
        },
        typePlacement: (current) => {
          seen.push('typePlacement')
          return current
        },
      },
      ruleExclusions: { 'no-console': ['dashboard/src/allowed.ts'] },
    })
    const rules = (name: string) =>
      config.overrides!.flatMap((scope) => (scope.rules?.[name] === undefined ? [] : [scope.rules[name]]))
    expect(seen).toEqual(['imports', 'typePlacement'])
    expect(rules('max-lines')).toContainEqual(['warn', { max: 123, skipBlankLines: true, skipComments: true }])
    expect(rules('complexity')).toContainEqual(['warn', { max: 17 }])
    expect(rules('perfectionist/sort-imports')[0]).toMatchObject(['warn', { internalPattern: ['^@company/'] }])
    expect(rules('modules/import-boundaries')[0]).toMatchObject([
      'warn',
      { fileRoles: ['prompts'], aliases: { '@api': '/fixture/api/src' }, publicEntrypoints: ['@company/api/client'] },
    ])
    expect(rules('modules/tanstack-runtime')[0]).toMatchObject([
      'warn',
      {
        rpcClients: ['/fixture/dashboard/src/services/bridge.client.ts'],
        serverImports: ['private-db'],
        clientImports: ['browser-sdk'],
        allowComputedImportsIn: ['/fixture/dashboard/src/services/loader.server.ts'],
      },
    ])
    expect(rules('arch/require-orpc-output')[0]).toMatchObject(['warn', { composers: ['paged'] }])
    expect(config.overrides!.find((scope) => scope.rules?.['arch/require-orpc-output'])?.files).toEqual([
      'api/src/rpc/public/**',
    ])
    expect(rules('arch/no-unescaped-like')[0]).toMatchObject(['warn', { sanitizers: ['escapePattern'] }])
    expect(JSON.stringify(config)).toContain('customResolver')
    expect(rules('modules/memoization')).toEqual([])
    expect(config.settings?.shadcn).toEqual({ ui: '@ui', componentImports: ['^@company/ui'] })
    expect(JSON.stringify(config)).toContain('/fixture/theme.css')
    expect(JSON.stringify(config)).toContain('/fixture/store.css')
    expect(JSON.stringify(config)).toContain('"rootFontSize":18')
    expect(rules('no-console')).toContain('warn')
    expect(rules('no-debugger')).toContain('off')
    expect(config.overrides!.at(-1)).toEqual({ files: ['dashboard/src/allowed.ts'], rules: { 'no-console': 'off' } })
  })

  test('grouped policy false values stay separate from disabled framework integrations', () => {
    const config = tanstackStartReactModulesPreset({
      architecture: { first: 'web', second: 'web' },
      tailwind: false,
      shadcn: false,
      policies: { react: false, imports: false, statementLayout: false },
    })
    const contents = JSON.stringify(config)
    expect(contents).not.toContain('oxlint-tailwindcss')
    expect(contents).not.toContain('@shadcn/lint')
    expect(contents).not.toContain('perfectionist/sort-imports')
    expect(contents).not.toContain('react/display-name')
    expect(contents).toContain('modules/import-boundaries')
    expect(contents).toContain('modules/memoization')
    expect(tanstackStartReactModulesPreset({ shadcn: false }).settings?.shadcn).toBeUndefined()
  })

  test('published types reject removed flat keys and renamed nested leaves', () => {
    const root = resolve(temporary, 'grouped-types')
    mkdirSync(root)
    const oldKeys = [
      'level',
      'maxLines',
      'complexity',
      'fileRoles',
      'publicEntrypoints',
      'aliases',
      'internalPatterns',
      'publicApi',
      'schemaComposers',
      'rpcClient',
      'sanitizers',
      'formResolver',
      'reactCompiler',
      'cli',
      'exclude',
      'tanstackRuntime',
      'banTypes',
      'typeSafety',
      'serviceModules',
      'moduleLayout',
      'naming',
      'comments',
      'formatting',
      'layout',
      'reactRules',
      'effects',
      'memoization',
      'routes',
      'schemas',
      'boundaries',
      'tests',
      'wrappers',
      'mutableState',
      'backendRules',
      'tailwindRules',
      'shadcnRules',
      'clientOwnership',
    ]
    const cases = [
      ...oldKeys.map((key) => `{ ${key}: false }`),
      '{ imports: false }',
      '{ forms: false }',
      '{ policies: { banTypes: false } }',
      '{ tailwind: { entryPoint: "old.css" } }',
      '{ tailwind: { entryPoints: {} } }',
      '{ shadcn: { ui: "@ui" } }',
      '{ shadcn: { componentImports: [] } }',
      '{ tanstackStart: { serverImports: [] } }',
    ]
    const path = resolve(root, 'removed.mts')
    writeFileSync(
      path,
      `import type { PresetOptions } from ${JSON.stringify(resolve(repository, 'dist/presets/index.d.ts'))};\n${cases.map((entry, i) => `export const old${i}: PresetOptions = ${entry};`).join('\n')}\n`,
    )
    const checked = spawnSync(
      process.execPath,
      [
        resolve(repository, 'node_modules/typescript/bin/tsc'),
        '--ignoreConfig',
        '--noEmit',
        '--pretty',
        'false',
        '--strict',
        '--skipLibCheck',
        '--module',
        'NodeNext',
        '--target',
        'ESNext',
        path,
      ],
      { encoding: 'utf8', timeout: 30_000 },
    )
    expect(checked.status).not.toBe(0)
    for (let i = 0; i < cases.length; i++) expect(checked.stdout).toContain(`removed.mts(${i + 2},`)
    expect(checked.stdout.match(/error TS/g)).toHaveLength(cases.length)
  })

  test('limits.maxFileLines keeps the 400 default and native skip flags while accepting a custom ceiling', () => {
    const defaults = fixture("architecture: { web: 'web' },", {}, true)
    expect(defaults.output).toContain('"max": 400')
    expect(defaults.output).toContain('"skipBlankLines": true')
    expect(defaults.output).toContain('"skipComments": true')
    const code =
      Array.from({ length: 6 }, (_, index) => 'export const value' + index + ' = ' + index + ';').join('\n') + '\n'
    const passed = fixture("architecture: { web: 'web' },\n  limits: { maxFileLines: 6 },", {
      'web/src/lib/values.ts': code,
    })
    expect(passed.status, passed.output).toBe(0)
    const failed = fixture("architecture: { web: 'web' },\n  limits: { maxFileLines: 5 },", {
      'web/src/lib/values.ts': code,
    })
    expect(failed.output).toContain('max-lines')
    const native = JSON.parse(
      fixture(
        "architecture: { web: 'web' },\n  limits: { maxFileLines: 5 },\n  ruleExclusions: { 'max-lines': ['web/src/lib/values.ts'] },",
        { 'web/src/lib/values.ts': code },
      ).output,
    )
    expect(native.diagnostics).toEqual([])
  })

  test('preset diagnostics identify the allowed route helper and action constant destinations', () => {
    const result = fixture("architecture: { web: 'web' },", {
      'web/src/routes/handlers/chat.ts': 'function format() { return 1; }',
      'web/src/services/theme/theme-action.apply.client.ts':
        'const THEME_LIMIT = 3; export function themeActionApplyClient() { return THEME_LIMIT; }',
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(output.diagnostics.find((entry) => entry.code === 'arch(no-file-level-helpers)')?.message).toBe(
      'format: Nest this helper in its owning route handler callback, or move genuine domain logic to a service. Do not create a component, hook or public helper to bypass this rule.',
    )
    expect(output.diagnostics.find((entry) => entry.code === 'modules(domain-constants)')?.message).toBe(
      "'THEME_LIMIT' belongs in 'theme.constants.ts' under this module-data policy. Use a domain-prefixed name; do not invent a factory to silence the rule.",
    )
    expect(output.diagnostics.find((entry) => entry.code === 'arch(filename-export-name)')?.message).toBe(
      "Function 'themeActionApplyClient' must be named 'themeActionApply' for file 'theme-action.apply.client.ts'.",
    )
  })

  test('TanStack runtime CLI accepts real boundary forms across flat and domain web roots', () => {
    const result = fixture(
      "architecture: { web: { role: 'web', layout: { services: 'flat' } }, admin: 'web', api: 'server' },\n  imports: { aliases: { '@admin': 'admin/src' } },",
      {
        'web/src/services/chat.client.ts':
          "import { createServerFn as serverFn } from '@tanstack/react-start';\n\nexport const chatRead = serverFn().handler(async () => (await import('./chat.server')).chatRead());\n",
        'web/src/services/chat.server.ts':
          "import { readFileSync } from 'node:fs';\n\nexport function chatRead() {\n  return readFileSync('file', 'utf8');\n}\n",
        'web/src/services/rpc.client.ts':
          "import { createIsomorphicFn } from '@tanstack/react-start';\nimport { chatRead } from './chat.server';\n\nexport const rpcRead = createIsomorphicFn().server(() => chatRead()).client(() => 'client');\n",
        'admin/src/services/chat/chat.rsc.tsx':
          "import { createServerFn } from '@tanstack/react-start';\n\nexport const chatRscRead = createServerFn().handler(() => <p>Hello</p>);\n",
        'admin/src/services/chat/chat.client.ts':
          "import * as start from '@tanstack/react-start';\n\nexport const chatRead = start.createServerFn().handler(async () => (await import('@admin/services/chat/chat.server')).chatRead());\n",
        'admin/src/services/chat/chat.server.ts': 'export function chatRead() {\n  return new Date();\n}\n',
        'api/src/services/chat/chat.service.ts':
          'export function makeChatService() {\n  return { read: () => process.cwd() };\n}\n',
      },
    )
    expect(result.status, result.output).toBe(0)
  })

  test('TanStack runtime CLI rejects leaks reexports spoofed boundaries and shared laundering', () => {
    const files = {
      'web/src/services/chat/chat.client.ts':
        "import { chatRead } from '@other/services/chat/chat.server'; export const chatLeak = () => chatRead();",
      'other/src/services/chat/chat.client.ts': "export const chatRead = () => import('./chat.server');",
      'web/src/services/export/export.client.ts': "export * from '../chat/chat.server';",
      'web/src/services/types/types.client.ts':
        "import type { ChatType } from '../chat/chat.server'; export type TypesValue = ChatType;",
      'web/src/services/chat/chat.constants.ts':
        "import { readFileSync } from 'node:fs'; export const CHAT_READ = readFileSync;",
      'web/src/services/chat/chat.utils.ts':
        "import { createServerFn } from '@tanstack/react-start'; export const chatRead = createServerFn().handler(() => import('cloudflare:workers'));",
      'web/src/services/chat/chat.server.ts': 'export function chatRead() { return window.location.href; }',
      'other/src/services/chat/chat.rsc.tsx':
        "import * as React from 'react'; export const chatRscRead = () => React.useState(1);",
      'web/src/services/fake/fake.client.ts': 'export const fakeRead = () => process.env.SECRET;',
      'web/src/services/rpc/rpc.client.ts':
        "import { createIsomorphicFn } from '@tanstack/react-start'; import { chatRead } from '../chat/chat.server'; export const rpcRead = createIsomorphicFn().server(() => chatRead()).client(() => chatRead());",
    }
    const result = fixture(
      "architecture: { web: 'web', other: 'web' },\n  imports: { aliases: { '@other': 'other/src' } },",
      files,
    )
    const output: PresetFixtureOutput = JSON.parse(result.output)
    const findings = output.diagnostics
      .filter((entry) => entry.code === 'modules(tanstack-runtime)')
      .map((entry) => entry.filename)
    expect(findings.sort()).toEqual(
      Object.keys(files)
        .filter((file) => !file.includes('/types/'))
        .sort(),
    )
  })

  test('runtime consumer exceptions customize exact computed-import files and RPC owners', () => {
    const options =
      "architecture: { web: { role: 'web', layout: { services: 'flat' } } },\n  orpc: { clientOwnerFile: 'web/src/services/bridge.client.ts' },\n  tanstackStart: { computedImportAllowedFiles: ['web/src/services/loader.server.ts'], additionalServerOnlyImports: ['private-db'] },"
    const result = fixture(options, {
      'web/src/services/bridge.client.ts':
        "import { createIsomorphicFn } from '@tanstack/react-start'; import { read } from 'private-db'; export const bridgeRead = createIsomorphicFn().server(() => read()).client(() => 'client');",
      'web/src/services/rpc.client.ts':
        "import { createIsomorphicFn } from '@tanstack/react-start'; import { read } from 'private-db'; export const rpcRead = createIsomorphicFn().server(() => read()).client(() => 'client');",
      'web/src/services/loader.server.ts': 'export const loaderRead = (path: string) => import(path);',
      'web/src/services/other.server.ts': 'export const otherRead = (path: string) => import(path);',
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(
      output.diagnostics
        .filter((entry) => entry.code === 'modules(tanstack-runtime)')
        .map((entry) => entry.filename)
        .sort(),
    ).toEqual(['web/src/services/other.server.ts', 'web/src/services/rpc.client.ts'])
  })

  test('method-only service objects lock binding and method names and reject slop', () => {
    const good = fixture("architecture: { dashboard: 'web', storefront: 'web' },", {
      'dashboard/src/types/theme.types.ts': 'export interface ThemeParams {\n  value: string;\n}\n',
      'storefront/src/types/theme.types.ts': 'export interface ThemeParams {\n  value: string;\n}\n',
      'dashboard/src/services/theme/theme.client.ts':
        "import type { ThemeParams } from '../../types/theme.types';\n\nexport const themeService = {\n  themeApply({ value }: ThemeParams) {\n    function themeNormalize(input: string) {\n      return input.trim().toLowerCase();\n    }\n\n    return themeNormalize(value).toUpperCase();\n  },\n};\n",
      'storefront/src/services/theme/theme.server.ts':
        "import type { ThemeParams } from '../../types/theme.types';\n\nexport const themeService = {\n  themeApply({ value }: ThemeParams) {\n    return value.trim().toUpperCase();\n  },\n};\n",
    })
    expect(good.status, good.output).toBe(0)
    const cases = {
      binding: 'export const otherService = { themeApply(value: string) { return value.trim().toLowerCase(); } };',
      method: 'export const themeService = { apply(value: string) { return value.trim().toLowerCase(); } };',
      wrapper: 'export const themeService = { themeApply(value: string) { return save(value); } };',
      guard: 'export const themeService = { themeIsString(value: string) { return typeof value === "string"; } };',
      config: 'export const themeConfig = { limit: 3 };',
      arrows: 'export const themeLabels = { themeApply: () => translate.apply() };',
      references: 'import { labels } from "labels"; export const themeLabels = { themeApply: labels.apply };',
      mixed: 'export const themeService = { limit: 3, themeApply(value: string) { return value.trim(); } };',
      spread: 'export const themeService = { ...other, themeApply(value: string) { return value.trim(); } };',
      computed: 'export const themeService = { [key](value: string) { return value.trim(); } };',
      private:
        'function themePrivate(value: string) { return value.trim(); } export const themeService = { themeApply(value: string) { return themePrivate(value) + "!"; } };',
    }
    const architecture = Object.fromEntries(Object.keys(cases).map((name) => [name, 'web']))
    const result = fixture(
      'architecture: ' + JSON.stringify(architecture) + ',',
      Object.fromEntries(
        Object.entries(cases).map(([name, code]) => [name + '/src/services/theme/theme.client.ts', code]),
      ),
    )
    const output: PresetFixtureOutput = JSON.parse(result.output)
    for (const name of Object.keys(cases)) {
      const expected = ['binding', 'method'].includes(name)
        ? 'arch(export-file-prefix)'
        : ['wrapper', 'guard'].includes(name)
          ? 'arch(no-trivial-functions)'
          : name === 'private'
            ? 'modules(service-functions)'
            : 'modules(domain-constants)'
      expect(
        output.diagnostics
          .filter((entry) => entry.filename === name + '/src/services/theme/theme.client.ts')
          .map((entry) => entry.code),
        name,
      ).toContain(expected)
    }
    const utils = fixture("architecture: { web: 'web' },", { 'web/src/services/theme/theme.utils.ts': cases.method })
    expect(utils.output).toContain('modules(domain-constants)')
  })

  test('per-root folder layouts support flat and domain services independently', () => {
    const options =
      "architecture: { dashboard: { role: 'web', layout: { services: 'flat', features: 'domain', hooks: 'domain' } }, storefront: { role: 'web', layout: { services: 'domain', features: 'flat' } }, api: { role: 'server', layout: { services: 'domain' } } },"
    const passed = fixture(options, {
      'dashboard/src/services/chat.client.ts': 'export function chatRead() {\n  return new Map<string, string>();\n}\n',
      'storefront/src/services/chat/chat.client.ts':
        'export function chatRead() {\n  return new Map<string, string>();\n}\n',
      'dashboard/src/features/chat/chat-view.ts': 'export const chatValue = 3;\n',
      'storefront/src/features/value.ts': 'export const value = 3;\n',
      'dashboard/src/hooks/chat/use-chat.ts': 'export function useChat() {\n  return new Map<string, string>();\n}\n',
      'api/src/services/chat/chat.service.ts':
        'export function makeChatService() {\n  return { read: () => new Date() };\n}\n',
    })
    expect(passed.status, passed.output).toBe(0)
    const failed = fixture(options, {
      'dashboard/src/services/chat/chat.client.ts': 'export const chatValue = new Date();',
      'storefront/src/services/chat.client.ts': 'export const chatValue = new Date();',
      'storefront/src/services/chat/deep/chat.client.ts': 'export const chatValue = new Date();',
      'storefront/src/services/other/chat.client.ts': 'export const chatValue = new Date();',
      'dashboard/src/features/chat/wrong.ts': 'export const value = 3;',
      'dashboard/src/hooks/chat/use-wrong.ts': 'export function useWrong() { return new Date(); }',
      'storefront/src/features/chat/chat.ts': 'export const value = 3;',
      'api/src/services/chat.service.ts': 'export function makeChatService() { return { read: () => new Date() }; }',
    })
    const output: PresetFixtureOutput = JSON.parse(failed.output)
    for (const file of Object.keys({
      'dashboard/src/services/chat/chat.client.ts': 1,
      'storefront/src/services/chat.client.ts': 1,
      'storefront/src/services/chat/deep/chat.client.ts': 1,
      'storefront/src/features/chat/chat.ts': 1,
      'api/src/services/chat.service.ts': 1,
    }))
      expect(output.diagnostics.filter((entry) => entry.filename === file).map((entry) => entry.code)).toContain(
        'arch(no-restricted-files)',
      )
    for (const file of [
      'storefront/src/services/other/chat.client.ts',
      'dashboard/src/features/chat/wrong.ts',
      'dashboard/src/hooks/chat/use-wrong.ts',
    ])
      expect(output.diagnostics.filter((entry) => entry.filename === file).map((entry) => entry.code)).toContain(
        'arch(folder-prefix)',
      )
    const config = JSON.parse(fixture(options, {}, true).output)
    const owners = config.overrides.flatMap((scope: { rules?: Record<string, unknown> }) =>
      scope.rules?.['arch/no-restricted-token'] ? [scope.rules['arch/no-restricted-token']] : [],
    )
    expect(JSON.stringify(owners)).toContain('dashboard/src/services/rpc.client.ts')
    expect(JSON.stringify(owners)).toContain('storefront/src/services/rpc/rpc.client.ts')
    const override = fixture(options + "orpc: { clientOwnerFile: 'dashboard/src/services/api.client.ts' },", {}, true)
    expect(override.output).toContain('dashboard/src/services/api.client.ts')
  })

  test('folder layout configuration validates modes paths overlap and standalone roots', () => {
    const invalid = [
      { services: 'mixed' },
      { '/services': 'flat' },
      { '../services': 'flat' },
      { 'services/../lib': 'flat' },
      { 'services//nested': 'flat' },
      { 'services/*': 'flat' },
      { 'services/private': 'flat' },
      { features: 'domain', 'features/chat': 'flat' },
    ]
    for (const layout of invalid)
      expect(() =>
        tanstackStartReactModulesPreset({ architecture: { web: { role: 'web', layout } } } as never),
      ).toThrow()
    expect(() => tanstackStartReactModulesPreset({ architecture: { web: { role: 'unknown' } } } as never)).toThrow()
    expect(() =>
      tanstackStartReactModulesPreset({ architecture: { web: { role: 'web' }, 'web/nested': 'server' } }),
    ).toThrow('overlap')
    const standalone = fixture(
      "architecture: { '.': { role: 'web', layout: { services: 'flat', features: 'flat' } } },",
      { 'src/services/chat.client.ts': 'export function chatRead() {\n  return new Map<string, string>();\n}\n' },
    )
    expect(standalone.status, standalone.output).toBe(0)
  })

  test('JSX RSC services preserve public operations, helper ownership, names and constants across web roots', () => {
    const options = "architecture: { dashboard: 'web', storefront: 'web', api: 'server' },"
    const good =
      "export function chatRscRead() {\n  function chatNormalize(value: string) {\n    return value.trim().toLowerCase();\n  }\n\n  return <p>{chatNormalize('Hello')}</p>;\n}\n\nexport function chatRscWrite() {\n  return <p>Written</p>;\n}\n"
    const passed = fixture(options, {
      'dashboard/src/services/chat/chat.rsc.tsx': good,
      'storefront/src/services/chat/chat.rsc.tsx': good,
      'dashboard/src/services/chat/chat-action.render.rsc.tsx':
        'export function chatActionRender() {\n  return <p>Rendered</p>;\n}\n',
    })
    expect(passed.status, passed.output).toBe(0)
    const failed = fixture(options, {
      'dashboard/src/services/chat/chat.rsc.tsx':
        'const chatLabels = { yes: "Yes" }; function chatPrivate() { return 1; } export function chatRscRead() { function normalize() { return 2; } return <p>{chatPrivate() + normalize() + chatLabels.yes}</p>; } export function chatWrite() { return <p>Written</p>; }',
      'storefront/src/services/chat/chat.rsc.tsx':
        'const chatLimit = 4; export function chatRscRead() { return <p>{chatLimit}</p>; }',
      'dashboard/src/services/chat/chat-action.render.rsc.tsx':
        'export function chatActionRender() { return <p>Rendered</p>; } export function chatOther() { return <p>Other</p>; }',
      'storefront/src/services/chat/chat-query.render.rsc.tsx':
        'export function chatQueryWrong() { return <p>Wrong</p>; }',
    })
    const output: PresetFixtureOutput = JSON.parse(failed.output)
    const rules = (file: string) =>
      output.diagnostics.filter((entry) => entry.filename === file).map((entry) => entry.code)
    expect(rules('dashboard/src/services/chat/chat.rsc.tsx')).toEqual(
      expect.arrayContaining([
        'modules(service-functions)',
        'modules(domain-constants)',
        'arch(export-file-prefix)',
        'arch(export-name-pattern)',
      ]),
    )
    expect(rules('storefront/src/services/chat/chat.rsc.tsx')).toContain('modules(domain-constants)')
    expect(rules('dashboard/src/services/chat/chat-action.render.rsc.tsx')).toContain('modules(service-functions)')
    expect(rules('storefront/src/services/chat/chat-query.render.rsc.tsx')).toContain('arch(filename-export-name)')
  })

  test('cohesive frontend APIs and state factories pass in multiple roots and runtimes', () => {
    const options = "architecture: { dashboard: 'web', storefront: 'web', api: 'server' },"
    const files: Record<string, string> = {}
    const operations =
      "import { CHAT_PREFIX } from './chat.constants';\nimport type { ChatParams } from '../../types/chat.types';\n\nexport function chatRead({ value }: ChatParams) {\n  function chatNormalize(input: string) {\n    return input.trim().toLowerCase();\n  }\n\n  return `${CHAT_PREFIX}${chatNormalize(value)}`;\n}\n\nexport const chatWrite = ({ value }: ChatParams) => {\n  const chatFormat = (input: string) => input.trim().toUpperCase();\n\n  return `${chatFormat(value)}!`;\n};\n"
    for (const root of ['dashboard', 'storefront']) {
      files[`${root}/src/types/chat.types.ts`] = 'export interface ChatParams {\n  value: string;\n}\n'
      files[`${root}/src/services/chat/chat.constants.ts`] = "export const CHAT_PREFIX = 'Chat: ';\n"
      files[`${root}/src/services/chat/chat.client.ts`] =
        operations +
        '\nexport function chatCreateService() {\n  const state = new Map<string, string>();\n\n  return { read: (key: string) => state.get(key) };\n}\n\nexport const chatService = chatCreateService();\n'
      files[`${root}/src/services/chat/chat.server.ts`] = operations
      files[`${root}/src/services/chat/chat.rsc.ts`] = operations
        .replaceAll('chatRead', 'chatRscRead')
        .replaceAll('chatWrite', 'chatRscWrite')
    }
    const result = fixture(options, files)
    expect(result.status, result.output).toBe(0)
    const legacy = fixture(
      options +
        "policies: { serviceStructure: (scopes) => [...scopes, { files: ['dashboard/src/services/chat/chat.client.ts'], rules: { 'modules/service-functions': ['error', { frontend: false }] } }] },",
      files,
    )
    const output: PresetFixtureOutput = JSON.parse(legacy.output)
    const rejected = output.diagnostics.filter((entry) => entry.code === 'modules(service-functions)')
    expect(rejected.length).toBeGreaterThan(0)
    expect([...new Set(rejected.map((entry) => entry.filename))]).toEqual([
      'dashboard/src/services/chat/chat.client.ts',
    ])
  })

  test('frontend operation policy rejects private satellites, wrong names and config without relaxing backend rules', () => {
    const result = fixture("architecture: { dashboard: 'web', storefront: 'web', api: 'server', worker: 'runner' },", {
      'dashboard/src/services/chat/chat.client.ts':
        'function chatPrivate() { return 1 } export function chatRead() { return chatPrivate() + 1 } export function chatWrite() { return 2 }',
      'storefront/src/services/chat/chat.server.ts':
        'const chatPrivate = () => 1; export function chatRead() { return chatPrivate() + 1 }',
      'dashboard/src/services/theme/theme.client.ts':
        'export function themeRead() { function normalize(value: string) { return value.trim().toLowerCase() } return normalize("hello") + "!" } export function wrongName() { return 2 }',
      'dashboard/src/services/chat/chat.constants.ts':
        'const foreignLimit = 3; export const CHAT_LIMIT = foreignLimit + 1;',
      'storefront/src/services/chat/chat.utils.ts': 'export const chatLabels = { yes: "Yes" };',
      'dashboard/src/services/labels/labels.server.ts': 'export const labelsOptions = ["a", "b"];',
      'dashboard/src/services/react/react.client.ts':
        'import { useState } from "react"; export const reactState = useState;',
      'dashboard/src/services/chat/chat.ts':
        'export function chatRead() { return 1 } export function chatWrite() { return 2 }',
      'dashboard/src/services/chat/chat-action.send.client.ts':
        'export function chatActionSend() { function chatNormalize() { return 1 } return chatNormalize() + 1 } export function chatOther() { return 2 }',
      'storefront/src/services/chat/chat-query.load.server.ts':
        'export function chatQueryOther() { function chatNormalize() { return 1 } return chatNormalize() + 1 }',
      'api/src/services/chat/chat.service.ts':
        'export function makeChatService() { function chatRead() { return 1 } return { read: chatRead } }',
      'worker/src/services/chat/chat-action.send.ts':
        'export function chatActionSend() { return 1 } export function chatOther() { return 2 }',
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    const rules = (file: string) =>
      output.diagnostics.filter((entry) => entry.filename === file).map((entry) => entry.code)
    for (const file of [
      'dashboard/src/services/chat/chat.client.ts',
      'storefront/src/services/chat/chat.server.ts',
      'dashboard/src/services/chat/chat-action.send.client.ts',
      'api/src/services/chat/chat.service.ts',
      'worker/src/services/chat/chat-action.send.ts',
    ])
      expect(rules(file)).toContain('modules(service-functions)')
    expect(
      rules('dashboard/src/services/theme/theme.client.ts').filter((code) => code === 'arch(export-file-prefix)'),
    ).toHaveLength(2)
    expect(rules('dashboard/src/services/theme/theme.client.ts')).not.toContain('modules(service-functions)')
    expect(rules('dashboard/src/services/chat/chat.constants.ts')).toContain('arch(export-file-prefix)')
    expect(rules('storefront/src/services/chat/chat.utils.ts')).toContain('modules(domain-constants)')
    expect(rules('dashboard/src/services/labels/labels.server.ts')).toContain('modules(domain-constants)')
    expect(rules('dashboard/src/services/react/react.client.ts')).toContain('modules(import-boundaries)')
    expect(rules('dashboard/src/services/chat/chat.ts')).toContain('arch(no-restricted-files)')
    expect(rules('storefront/src/services/chat/chat-query.load.server.ts')).toContain('arch(filename-export-name)')
    expect(rules('storefront/src/services/chat/chat-query.load.server.ts')).not.toContain('modules(service-functions)')
  })

  test('frontend constants exclusions stay file-specific', () => {
    const result = fixture(
      "architecture: { dashboard: 'web', storefront: 'web' },\n  ruleExclusions: { 'modules/domain-constants': ['dashboard/src/services/chat/chat.client.ts'] },",
      {
        'dashboard/src/services/chat/chat.client.ts': 'export const CHAT_LIMIT = 3;',
        'storefront/src/services/chat/chat.client.ts': 'export const CHAT_LIMIT = 3;',
      },
    )
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(
      output.diagnostics.filter((entry) => entry.code === 'modules(domain-constants)').map((entry) => entry.filename),
    ).toEqual(['storefront/src/services/chat/chat.client.ts'])
  })

  test('type imports switch to namespaces above three names and qualify references on CLI autofix', () => {
    const path = 'apps/web/src/types/sample.types.ts'
    const source =
      "import type { ContractA, ContractB, ContractC, ContractD } from './contract.types';\n\nexport type SampleCombined = [ContractA, ContractB, ContractC, ContractD];\n"
    const contracts =
      'export interface ContractA {\n  a: string;\n}\n\nexport interface ContractB {\n  b: string;\n}\n\nexport interface ContractC {\n  c: string;\n}\n\nexport interface ContractD {\n  d: string;\n}\n'
    const files = { 'apps/web/src/types/contract.types.ts': contracts, [path]: source }
    const three = fixture('', { ...files, [path]: source.replaceAll(', ContractD', '') })
    expect(three.status, three.output).toBe(0)
    const four = fixture('', files)
    const output: PresetFixtureOutput = JSON.parse(four.output)
    expect(output.diagnostics.map((entry) => entry.code)).toEqual(['arch(prefer-namespace-type-import)'])
    execFileSync(process.execPath, [binary, '-c', resolve(four.root, 'oxlint.config.ts'), '--fix', path], {
      cwd: four.root,
      encoding: 'utf8',
    })
    const fixed = readFileSync(resolve(four.root, path), 'utf8')
    expect(fixed).toBe(
      "import type * as ContractTypes from './contract.types';\n\nexport type SampleCombined = [ContractTypes.ContractA, ContractTypes.ContractB, ContractTypes.ContractC, ContractTypes.ContractD];\n",
    )
    const namespace = fixture('', { ...files, [path]: fixed })
    expect(namespace.status, namespace.output).toBe(0)
    execFileSync(process.execPath, [binary, '-c', resolve(four.root, 'oxlint.config.ts'), '--fix', path], {
      cwd: four.root,
      encoding: 'utf8',
    })
    expect(readFileSync(resolve(four.root, path), 'utf8')).toBe(fixed)
    const typecheck = spawnSync(
      process.execPath,
      [
        resolve(repository, 'node_modules/typescript/bin/tsc'),
        '--noEmit',
        '--ignoreConfig',
        '--strict',
        '--skipLibCheck',
        path,
      ],
      { cwd: four.root, encoding: 'utf8', timeout: 30_000 },
    )
    expect(typecheck.status, typecheck.stdout + typecheck.stderr).toBe(0)
    const customized = fixture(
      "policies: { imports: (scopes) => scopes.map((scope) => ({ ...scope, rules: { ...scope.rules, 'arch/prefer-namespace-type-import': ['error', { max: 4 }] } })) },",
      files,
    )
    expect(customized.status, customized.output).toBe(0)
  })

  test('domain utilities and portable own contracts pass in every web root', () => {
    const options =
      "architecture: { dashboard: 'web', storefront: 'web', api: 'server', worker: 'runner' },\n  imports: { aliases: { '@dashboard': 'dashboard/src', '@storefront': 'storefront/src' } },"
    const files: Record<string, string> = {}
    for (const root of ['dashboard', 'storefront']) {
      files[`${root}/src/types/fade.types.ts`] = 'export interface FadeOptions {\n  width: number;\n}\n'
      files[`${root}/src/lib/fade.ts`] =
        "import type { FadeOptions } from '@/types/fade.types';\n\nexport function fadeWidth(options: FadeOptions) {\n  return options.width.toFixed(1);\n}\n"
      files[`${root}/src/lib/fade.utils.ts`] =
        `import type { FadeOptions } from '@${root}/types/fade.types';\n\nexport function fadeWidth(options: FadeOptions) {\n  return options.width.toFixed(1);\n}\n`
      files[`${root}/src/lib/nested/fade.ts`] =
        "import type { FadeOptions } from '../../types/fade.types.ts';\n\nexport function fadeWidth(options: FadeOptions) {\n  return options.width.toFixed(1);\n}\n"
      files[`${root}/src/services/chat/chat.utils.ts`] =
        'function chatNormalize(value: string) {\n  return value.trim().toLowerCase();\n}\n\nexport function chatLabel(value: string) {\n  return `Chat: ${chatNormalize(value)}`;\n}\n\nexport function chatTitle(value: string) {\n  return value.trim().toUpperCase();\n}\n'
      files[`${root}/src/types/chat.types.ts`] = 'export interface ChatParams {\n  value: string;\n}\n'
      files[`${root}/src/services/chat/chat.client.ts`] =
        "import { chatLabel } from './chat/chat.utils';\nimport type { ChatParams } from '../types/chat.types';\n\nexport function chatDisplay({ value }: ChatParams) {\n  return `${chatLabel(value)}!`;\n}\n"
    }
    for (const root of ['api', 'worker']) {
      files[`${root}/src/services/chat/chat.utils.ts`] =
        'export function chatLabel(value: string) {\n  return value.trim().toLowerCase();\n}\n'
      files[`${root}/src/lib/chat.ts`] =
        "import { chatLabel } from '../services/chat/chat.utils';\n\nexport function chatDisplay(value: string) {\n  return `${chatLabel(value)}!`;\n}\n"
    }
    const valid = fixture(options, files)
    expect(valid.status, valid.output).toBe(0)
    const invalid = fixture(options, {
      ...files,
      'dashboard/src/services/chat/chat.utils.ts': files['dashboard/src/services/chat/chat.utils.ts'].replaceAll(
        'chatNormalize',
        'normalize',
      ),
      'storefront/src/services/chat/chat.helpers.ts': files['storefront/src/services/chat/chat.utils.ts'],
    })
    const output: PresetFixtureOutput = JSON.parse(invalid.output)
    expect(
      output.diagnostics.filter((entry) => entry.code === 'arch(export-file-prefix)').map((entry) => entry.filename),
    ).toContain('dashboard/src/services/chat/chat.utils.ts')
    expect(
      output.diagnostics.filter((entry) => entry.code === 'arch(no-restricted-files)').map((entry) => entry.filename),
    ).toEqual(['storefront/src/services/chat/chat.helpers.ts'])
  })

  test('portable lib rejects app services and types through aliases, relative paths and re-exports', () => {
    const options =
      "architecture: { dashboard: 'web', storefront: 'web', api: 'server', worker: 'runner' },\n  imports: { aliases: { '@dashboard': 'dashboard/src', '@storefront': 'storefront/src', '@api': 'api/src' }, backendEntryPoints: ['@fixture/api/client'] },"
    const imports = [
      "import { fade } from '@/services/fade/fade.utils'; fade();",
      "import { fade } from '../../services/fade/fade.utils'; fade();",
      "import type { FadeOptions } from '@dashboard/services/fade/fade.types'; export function fadeWidth(value: FadeOptions) { return value.width + 1; }",
      "export * from '@storefront/services/fade/fade.utils';",
      "export type { FadeOptions } from '@fixture/api/client';",
      "import type { FadeOptions } from '@api/types/fade.types'; export function fadeWidth(value: FadeOptions) { return value.width + 1; }",
      "import type { FadeOptions } from '../../../../api/src/types/fade.types'; export function fadeWidth(value: FadeOptions) { return value.width + 1; }",
      "import type { FadeOptions } from '@/types/chat.types'; export function fadeWidth(value: FadeOptions) { return value.width + 1; }",
      "import { FadeOptions } from '@/types/fade.types'; export function fadeWidth(value: FadeOptions) { return value.width + 1; }",
      "import type { FadeOptions } from '@storefront/types/fade.types'; export function fadeWidth(value: FadeOptions) { return value.width + 1; }",
      "import type { FadeOptions } from '../../../../storefront/src/types/fade.types'; export function fadeWidth(value: FadeOptions) { return value.width + 1; }",
      "export type { FadeOptions } from '@/types/fade.types';",
      "export type * from '../../types/fade.types';",
      "export * as fadeTypes from '@/types/fade.types';",
      "import type { FadeOptions } from '@/types/fade.types'; export type { FadeOptions };",
      "import type * as FadeTypes from '@/types/fade.types'; export type { FadeTypes };",
      "export const fadeLoad = import('@dashboard/services/fade/fade.utils');",
      "export function fadeWidth(value: import('@/types/chat.types').FadeOptions) { return value.width + 1; }",
      "import { fade } from '@/lib/../services/fade/fade.utils'; fade();",
    ]
    const files: Record<string, string> = {
      'api/package.json': '{"name":"@fixture/api","type":"module"}',
      'dashboard/package.json': '{"name":"@fixture/dashboard","type":"module"}',
    }
    const denied = imports.map((code, index) => {
      const file = `dashboard/src/lib/case-${index}/fade.ts`
      files[file] = code
      return file
    })
    files['storefront/src/lib/fade.ts'] = "export type { FadeOptions } from '@/types/fade.types';"
    denied.push('storefront/src/lib/fade.ts')
    files['storefront/src/lib/app.ts'] = "export * from '@fixture/dashboard/services/fade/fade.utils';"
    denied.push('storefront/src/lib/app.ts')
    const result = fixture(options, files)
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(result.status).not.toBe(0)
    expect(
      [
        ...new Set(
          output.diagnostics
            .filter((entry) => entry.code === 'modules(import-boundaries)')
            .map((entry) => entry.filename),
        ),
      ].sort(),
    ).toEqual(denied.sort())
  })

  test('portable lib exceptions stay file-specific and preserve backend boundaries', () => {
    const options =
      "architecture: { dashboard: 'web', storefront: 'web', api: 'server' },\n  ruleExclusions: { 'modules/import-boundaries': ['dashboard/src/lib/adapter.ts'] },"
    const files = {
      'dashboard/src/lib/adapter.ts':
        "import type { ChatOptions } from '../types/chat.types';\n\nexport function adapterWidth(value: ChatOptions) {\n  return value.width + 1;\n}\n",
      'dashboard/src/types/chat.types.ts': 'export interface ChatOptions {\n  width: number;\n}\n',
    }
    const allowed = fixture(options, files)
    expect(allowed.status, allowed.output).toBe(0)
    const denied = fixture(options, {
      ...files,
      'storefront/src/lib/adapter.ts': files['dashboard/src/lib/adapter.ts'],
      'dashboard/src/lib/other.ts': files['dashboard/src/lib/adapter.ts'],
      'api/src/core/invalid.ts': "import { query } from '../services/chat/chat-query.list'; query();",
    })
    const output: PresetFixtureOutput = JSON.parse(denied.output)
    expect(
      output.diagnostics
        .filter((entry) => entry.code === 'modules(import-boundaries)')
        .map((entry) => entry.filename)
        .sort(),
    ).toEqual(['dashboard/src/lib/other.ts', 'storefront/src/lib/adapter.ts'])
  })

  test('a complete multi-root project with concept builders and returned methods passes the CLI', () => {
    const options =
      "architecture: { dashboard: 'web', storefront: 'web', api: 'server', shared: 'packages', tools: 'scripts' },\n  modules: { customFileRoles: ['prompts'] },"
    const files = {
      'dashboard/src/services/theme/theme.client.ts':
        'export function themeCreateService() {\n  const themeToggle = (value: string) => value.trim();\n\n  return { toggle: themeToggle };\n}\n',
      'storefront/src/services/theme/theme.client.ts':
        'export function themeCreateService() {\n  function themeToggle(value: string) {\n    return value.toUpperCase();\n  }\n\n  return { toggle: themeToggle };\n}\n',
      'api/src/services/route/route.prompts.ts':
        'function routePromptsNormalize(value: string) {\n  return value.trim().toLowerCase();\n}\n\nexport function routePromptsJudge(value: string) {\n  return `Judge: ${routePromptsNormalize(value)}`;\n}\n\nexport function routePromptsApproval(value: string) {\n  return `Approve: ${value}`;\n}\n',
      'shared/src/text.ts': 'export function textTrim(value: string) {\n  return value.trim();\n}\n',
      'tools/report.ts': "console.log('ready');\n",
    }
    const valid = fixture(options, files)
    expect(valid.status, valid.output).toBe(0)
    const invalid = fixture(options, {
      ...files,
      'dashboard/src/services/theme/theme.client.ts': files['dashboard/src/services/theme/theme.client.ts'].replaceAll(
        'themeToggle',
        'toggle',
      ),
      'storefront/src/services/route/route.prompts.ts':
        "export { routePromptsJudge } from '../../../../api/src/services/route/route.prompts';\n",
    })
    const output: PresetFixtureOutput = JSON.parse(invalid.output)
    expect(invalid.status).not.toBe(0)
    expect(output.diagnostics.map((entry) => entry.code)).toContain('arch(export-file-prefix)')
    expect(output.diagnostics.map((entry) => entry.code)).toContain('modules(import-boundaries)')
  })

  test('normalizes roots and rejects ambiguous ownership', () => {
    const config = tanstackStartReactModulesPreset({
      architecture: { './apps/dashboard/': 'web', 'apps/storefront': 'web' },
    })
    expect(config.overrides?.some((scope) => scope.files.some((path) => path.startsWith('apps/dashboard/src/')))).toBe(
      true,
    )
    const architectures: PresetArchitecture[] = [
      { 'apps/web': 'web', 'apps/web/nested': 'server' },
      { './apps/web/': 'web', 'apps/web': 'server' },
      { '.': 'web', packages: 'packages' },
      { '../external': 'web' },
      { '/': 'web' },
      { '': 'web' },
      { '   ': 'web' },
      { 'C:/apps/web': 'web' },
    ]
    for (const architecture of architectures) expect(() => tanstackStartReactModulesPreset({ architecture })).toThrow()
    expect(() => tanstackStartReactModulesPreset(JSON.parse('{"architecture":{"apps/site":"invalid"}}'))).toThrow(
      'Unknown architecture role',
    )
    for (const role of [
      'service',
      'client',
      'server',
      'rsc',
      'utils',
      'action',
      'query',
      'types',
      'constants',
      'handler',
      'test',
      'spec',
    ]) {
      expect(() => tanstackStartReactModulesPreset({ modules: { customFileRoles: [role] } })).toThrow('built-in roles')
    }
  })

  test('each frontend uses its own Tailwind entry point and theme', () => {
    const root = '/fixture'
    const config = tanstackStartReactModulesPreset({
      root,
      architecture: { 'apps/dashboard': 'web', 'apps/storefront': 'web' },
      tailwind: { cssEntryPointsByRoot: { 'apps/storefront': 'themes/store.css' } },
    })
    expect(
      config.overrides
        ?.filter((scope) => scope.rules?.['tailwindcss/enforce-canonical'])
        .map((scope) => ({ files: scope.files, rule: scope.rules?.['tailwindcss/enforce-canonical'] })),
    ).toEqual([
      {
        files: ['apps/dashboard/src/**/*.{ts,tsx,mts,cts}'],
        rule: ['error', { entryPoint: '/fixture/apps/dashboard/src/application/styles.css' }],
      },
      {
        files: ['apps/storefront/src/**/*.{ts,tsx,mts,cts}'],
        rule: ['error', { entryPoint: '/fixture/themes/store.css' }],
      },
    ])
    const result = fixture("architecture: { dashboard: 'web', storefront: 'web' },\n  tailwind: {  },", {
      'dashboard/package.json': '{"name":"dashboard","type":"module"}',
      'storefront/package.json': '{"name":"storefront","type":"module"}',
      'dashboard/components.json': '{"tailwind":{"css":"src/application/styles.css"}}',
      'storefront/components.json': '{"tailwind":{"css":"src/application/styles.css"}}',
      'dashboard/src/application/styles.css': '@import "tailwindcss";\n@theme { --color-dashboard: #123456; }\n',
      'storefront/src/application/styles.css': '@import "tailwindcss";\n@theme { --color-storefront: #654321; }\n',
      'dashboard/src/components/ui/card.tsx':
        "export function Card() {\n  return <div className='bg-dashboard'>Dashboard</div>;\n}\n",
      'storefront/src/components/ui/card.tsx':
        "export function Card() {\n  return <div className='bg-storefront'>Storefront</div>;\n}\n",
    })
    expect(result.status, result.output).toBe(0)
  })

  test('frontend operations retain their runtime suffix without making it part of the operation name', () => {
    const result = fixture('', {
      'apps/web/src/services/theme/theme-action.apply.client.ts':
        'export function themeActionApply(value: string) { function themeNormalize(input: string) { return input.trim(); } return themeNormalize(value).toUpperCase(); }',
      'apps/web/src/services/seo/seo-query.origin.server.ts':
        'export function seoQueryOrigin(value: string) { return value.trim(); }',
      'apps/web/src/services/feed/feed-query.list.rsc.ts':
        'export function feedQueryList(value: string) { return value.trim(); }',
      'apps/web/src/services/theme/theme-action.wrong.client.ts':
        'export function themeActionWrongClient(value: string) { return value.trim(); }',
      'apps/web/src/services/theme/theme-action.missing.ts':
        'export function themeActionMissing(value: string) { return value.trim(); }',
      'apps/server/src/services/theme/theme-action.apply.client.ts':
        'export function themeActionApply(value: string) { return value.trim(); }',
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(
      output.diagnostics.filter((entry) => entry.code === 'arch(filename-export-name)').map((entry) => entry.filename),
    ).toEqual(['apps/web/src/services/theme/theme-action.wrong.client.ts'])
    expect(
      output.diagnostics.filter((entry) => entry.code === 'arch(filename-match)').map((entry) => entry.filename),
    ).toEqual(['apps/server/src/services/theme/theme-action.apply.client.ts'])
    expect(
      output.diagnostics.filter((entry) => entry.code === 'arch(no-restricted-files)').map((entry) => entry.filename),
    ).toEqual(['apps/web/src/services/theme/theme-action.missing.ts'])
    expect(
      output.diagnostics.filter(
        (entry) => entry.code === 'modules(service-functions)' || entry.code === 'arch(export-name-pattern)',
      ),
    ).toEqual([])
  })

  test('frontend helpers stay inside public operations while backend factories stay strict', () => {
    const result = fixture(
      "architecture: { dashboard: 'web', storefront: 'web', api: 'server', worker: 'runner', shared: 'packages', tools: 'scripts' },",
      {
        'dashboard/src/services/theme/theme.client.ts':
          'export function themeCreateService() { function themeToggle(value: string) { return value.trim(); } const themeRead = (value: string) => value.toUpperCase(); return { toggle: themeToggle, read: themeRead }; }',
        'storefront/src/services/theme/theme.client.ts':
          'export function themeCreateService() { const themePrivate = (value: string) => value.trim(); function themeToggle(value: string) { return themePrivate(value).toUpperCase(); } return { toggle: themeToggle }; }',
        'dashboard/src/services/wrong/wrong.client.ts':
          'export function wrongCreateService() { const toggle = (value: string) => value.trim(); return { toggle }; }',
        'api/src/services/theme/theme.service.ts':
          'export function makeThemeService() { const themeToggle = (value: string) => value.trim(); return { toggle: themeToggle }; }',
        'worker/src/services/theme/theme.service.ts':
          'export function makeThemeService() { function themeToggle(value: string) { return value.trim(); } return { toggle: themeToggle }; }',
        'shared/src/services/theme/theme.ts':
          'export function first(value: string) { return value.trim(); } export function second(value: string) { return value.toUpperCase(); }',
        'tools/report.ts': "console.log('ready');\n",
      },
    )
    const output: PresetFixtureOutput = JSON.parse(result.output)
    const service = output.diagnostics
      .filter((entry) => entry.code === 'modules(service-functions)')
      .map((entry) => entry.filename)
      .sort()
    expect(service).toEqual(['api/src/services/theme/theme.service.ts', 'worker/src/services/theme/theme.service.ts'])
    expect(
      output.diagnostics.filter((entry) => entry.code === 'arch(export-file-prefix)').map((entry) => entry.filename),
    ).toEqual(['dashboard/src/services/wrong/wrong.client.ts'])
    expect(output.diagnostics.filter((entry) => entry.filename === 'tools/report.ts')).toEqual([])
  })

  test('declared concepts retain full role names and private same-root ownership through barrels', () => {
    const result = fixture(
      "architecture: { dashboard: 'web', storefront: 'web', api: 'server' },\n  modules: { customFileRoles: ['prompts'] },",
      {
        'dashboard/src/services/route/route.prompts.ts':
          'function routePromptsNormalize(value: string) { return value.trim(); } export function routePromptsJudge(value: string) { return `Judge: ${routePromptsNormalize(value)}`; } export function routePromptsApproval(value: string) { return `Approve: ${value}`; }',
        'dashboard/src/services/route/route-query.local.ts':
          "import { routePromptsJudge } from './route.prompts'; export function routeQueryLocal(value: string) { return routePromptsJudge(value.trim()); }",
        'dashboard/src/services/route/route.barrel.ts': "export { routePromptsJudge } from './route.prompts';",
        'dashboard/src/services/route/route-second.barrel.ts': "export * from './route.barrel';",
        'dashboard/src/services/route/route.client.ts':
          "import { routePromptsJudge } from './route.prompts'; export function routeCreateService() { return { judge(value: string) { return routePromptsJudge(value.trim()); } }; }",
        'dashboard/src/services/route/route-public.utils.ts': "export * from './route-second.barrel';",
        'dashboard/src/services/route/route-alias.utils.ts':
          "import { routePromptsJudge as routeAliasJudge } from './route.barrel'; export { routeAliasJudge };",
        'dashboard/src/services/route/route-namespace.utils.ts': "export * as routeNamespace from './route.prompts';",
        'dashboard/src/services/route/route-imported.utils.ts':
          "import * as routeImported from './route.barrel'; export { routeImported };",
        'dashboard/src/services/other/other-query.barrel.ts':
          "import { routePromptsJudge } from '../route/route-second.barrel'; export function otherQueryBarrel(value: string) { return routePromptsJudge(value.trim()); }",
        'dashboard/src/services/other/other-query.direct.ts':
          "import { routePromptsJudge } from '../route/route.prompts'; export function otherQueryDirect(value: string) { return routePromptsJudge(value.trim()); }",
        'storefront/src/services/route/route-query.cross.ts':
          "import { routePromptsJudge } from '../../../../dashboard/src/services/route/route.prompts'; export function routeQueryCross(value: string) { return routePromptsJudge(value.trim()); }",
        'storefront/src/services/route/route.types.ts':
          "import type { routePromptsJudge } from '../../../../dashboard/src/services/route/route.prompts'; export type RouteJudge = ReturnType<typeof routePromptsJudge>;",
        'storefront/src/services/route/route.barrel.ts':
          "export * from '../../../../dashboard/src/services/route/route.prompts';",
        'api/src/services/route/route.prompts.ts':
          'function routeWrong(value: string) { return value.trim(); } export function routePromptsJudge(value: string) { return `Judge: ${routeWrong(value)}`; }',
        'api/src/services/route/route.random.ts':
          'export function routeRandomOne(value: string) { return value.trim(); } export function routeRandomTwo(value: string) { return value.toUpperCase(); }',
      },
    )
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(
      output.diagnostics
        .filter((entry) => entry.code === 'modules(import-boundaries)')
        .map((entry) => entry.filename)
        .sort(),
    ).toEqual([
      'dashboard/src/services/other/other-query.barrel.ts',
      'dashboard/src/services/other/other-query.direct.ts',
      'dashboard/src/services/route/route-alias.utils.ts',
      'dashboard/src/services/route/route-imported.utils.ts',
      'dashboard/src/services/route/route-namespace.utils.ts',
      'dashboard/src/services/route/route-public.utils.ts',
      'storefront/src/services/route/route-query.cross.ts',
      'storefront/src/services/route/route.barrel.ts',
      'storefront/src/services/route/route.types.ts',
    ])
    expect(
      output.diagnostics
        .filter((entry) => entry.code === 'arch(export-file-prefix)' && entry.filename.endsWith('.prompts.ts'))
        .map((entry) => entry.filename),
    ).toEqual(['api/src/services/route/route.prompts.ts'])
    expect(
      output.diagnostics.filter((entry) => entry.code === 'modules(service-functions)').map((entry) => entry.filename),
    ).toEqual(['api/src/services/route/route.random.ts', 'api/src/services/route/route.random.ts'])
  })

  test('private domain names, exact exports and precise guards work together', () => {
    const result = fixture('', {
      'apps/server/src/services/room/room.utils.ts':
        'function isOwner(user: string, owner: string) { return user === owner; } export function roomUserIsOwner(user: string, owner: string) { return user === owner; }',
      'apps/server/src/services/room/room-action.send.ts':
        'export function roomActionSend() { const roomUserIsOwner = (user: string, owner: string) => user === owner; return roomUserIsOwner("a", "b"); }',
      'apps/server/src/services/room/room-query.load.ts':
        'export function roomQueryWrong() { const isOwner = (user: string, owner: string) => user === owner; return isOwner("a", "b"); }',
      'apps/server/src/services/guard/guard.utils.ts':
        'export function guardLooksValid(value: object) { return typeof value === "object" && value !== null; }',
      'apps/server/src/services/named/named.utils.ts':
        'function isRecord(value: object) { return Object.keys(value).length > 0; }',
      'apps/server/src/services/prompt/prompt.utils.ts':
        'export function promptWelcome(name: string) { return "Hello " + name; }',
      'apps/server/src/services/extra/extra-action.run.ts':
        'export function extraActionRun() { return 1; } export function extraHelper() { return 2; }',
      'apps/server/src/services/strict/strict.service.ts':
        'export function makeStrictService() { const strictHelper = () => Math.random(); return { strictHelper }; }',
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    const codes = (stem: string) =>
      output.diagnostics.filter((entry) => entry.filename.endsWith(stem)).map((entry) => entry.code)
    expect(codes('room.utils.ts').filter((code) => code === 'arch(export-file-prefix)')).toHaveLength(1)
    expect(codes('room-action.send.ts')).not.toContain('arch(export-file-prefix)')
    expect(codes('room-action.send.ts')).not.toContain('arch(filename-export-name)')
    expect(codes('room-action.send.ts')).not.toContain('modules(service-functions)')
    expect(codes('room-query.load.ts')).toContain('arch(export-file-prefix)')
    expect(codes('room-query.load.ts')).toContain('arch(filename-export-name)')
    expect(codes('guard.utils.ts')).toContain('arch(no-trivial-functions)')
    expect(codes('named.utils.ts')).toContain('arch(no-trivial-functions)')
    expect(codes('prompt.utils.ts')).not.toContain('arch(no-trivial-functions)')
    expect(codes('extra-action.run.ts')).toContain('modules(service-functions)')
    expect(codes('strict.service.ts')).toContain('modules(service-functions)')
  })

  test.each([true, false])('render-time props follow react.compiler=%s on a custom frontend root', (reactCompiler) => {
    const specimens = [
      ['jsx-no-new-object-as-prop', 'object-prop'],
      ['jsx-no-new-function-as-prop', 'function-prop'],
      ['jsx-no-new-array-as-prop', 'react-perf-jsx-no-new-array-as-prop'],
      ['jsx-no-jsx-as-prop', 'react-perf-jsx-no-jsx-as-prop'],
    ]
    const files: Record<string, string> = {}
    for (const [, stem] of specimens) {
      for (const kind of ['pass', 'fail']) {
        const name = stem.startsWith('react-perf-') ? `${stem}-${kind}-0` : stem
        files[`frontend/src/rule-cases/${stem}-${kind}.tsx`] = readFileSync(
          resolve(
            repository,
            `tests/fixtures/tanstack-start-react-modules/rules-${kind}/apps/web/src/rule-cases/${name}.tsx`,
          ),
          'utf8',
        )
      }
    }
    const result = fixture(`architecture: { frontend: 'web' }, react: { compiler: ${reactCompiler} },`, files)
    const output: PresetFixtureOutput = JSON.parse(result.output)
    for (const [rule, stem] of specimens) {
      for (const kind of ['pass', 'fail']) {
        const found = output.diagnostics.some(
          (entry) =>
            entry.filename === `frontend/src/rule-cases/${stem}-${kind}.tsx` && entry.code === `react-perf(${rule})`,
        )
        expect(found, `${stem}-${kind}`).toBe(!reactCompiler && kind === 'fail')
      }
    }
  })

  test('service constants follow ownership on custom roots, including frontend server files', () => {
    const result = fixture("architecture: { frontend: 'web', backend: 'server', worker: 'runner' },", {
      'frontend/src/services/demo/demo.client.ts': 'export const DEMO = 1;\n',
      'frontend/src/services/demo/demo.server.ts': 'export const DEMO = 1;\n',
      'frontend/src/services/demo/demo.rsc.ts': 'export const DEMO = 1;\n',
      'backend/src/services/demo/demo-action.send.ts': 'export const DEMO = 1;\n',
      'worker/src/services/demo/demo-action.send.ts': 'export const DEMO = 1;\n',
      'backend/src/services/demo/demo.constants.ts': 'export const DEMO = 1;\n',
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    const diagnostics = output.diagnostics
    expect(
      diagnostics
        .filter((entry) => entry.code === 'modules(domain-constants)')
        .map((entry) => entry.filename)
        .sort(),
    ).toEqual([
      'backend/src/services/demo/demo-action.send.ts',
      'frontend/src/services/demo/demo.client.ts',
      'frontend/src/services/demo/demo.rsc.ts',
      'frontend/src/services/demo/demo.server.ts',
      'worker/src/services/demo/demo-action.send.ts',
    ])
  })

  test('portable types and adapter exceptions exempt only the named files and rules', () => {
    const result = fixture(
      "ruleExclusions: { 'arch/no-type-declarations': ['apps/server/src/core/core.container.ts'], 'arch/no-trivial-functions': ['apps/server/src/services/bridge/bridge-query.remote.ts'] },",
      {
        'apps/server/src/core/core.container.ts': 'export type ContainerItem = string;\nexport let current = 1;\n',
        'apps/server/src/core/core.other.ts': 'export type OtherItem = string;\n',
        'apps/server/src/services/bridge/bridge-query.remote.ts':
          'export function bridgeQueryRemote() { return Math.random(); }\n',
        'apps/server/src/services/bridge/bridge-query.other.ts':
          'export function bridgeQueryOther() { return Math.random(); }\n',
      },
    )
    const output: PresetFixtureOutput = JSON.parse(result.output)
    const diagnostics = output.diagnostics
    const findings = diagnostics.map((entry) => `${entry.filename}:${entry.code}`)
    expect(findings).not.toContain('apps/server/src/core/core.container.ts:arch(no-type-declarations)')
    expect(findings).toContain('apps/server/src/core/core.other.ts:arch(no-type-declarations)')
    expect(findings).toContain('apps/server/src/core/core.container.ts:arch(no-module-mutable-state)')
    expect(findings).not.toContain('apps/server/src/services/bridge/bridge-query.remote.ts:arch(no-trivial-functions)')
    expect(findings).toContain('apps/server/src/services/bridge/bridge-query.other.ts:arch(no-trivial-functions)')
  })

  test('ships the full default plugin configuration and type-aware mode', () => {
    const result = fixture(
      '',
      {
        'apps/server/src/types/user.types.ts': 'export interface User { id: string; }\n',
      },
      true,
    )
    expect(result.status, result.output).toBe(0)
    const config = JSON.parse(result.output)
    expect(config.options.typeAware).toBe(true)
    expect(
      config.jsPlugins.some(
        (plugin: string | { name: string }) => typeof plugin !== 'string' && plugin.name === 'react-extra',
      ),
    ).toBe(true)
    expect(config.rules['no-debugger']).toBe('deny')
  })

  test('Tailwind fixes remain idempotent and recognize theme utilities and invalid classes', () => {
    const result = fixture('tailwind: { rootFontSize: 18 },', {
      'apps/web/components.json': '{"tailwind":{"css":"src/application/styles.css"}}',
      'apps/web/src/application/styles.css':
        '@import "tailwindcss";\n@theme { --color-brand: #123456; }\n@utility hit-area-2 { position: relative; }\n',
      'apps/web/src/components/ui/card.tsx':
        "export function Card() {\n  return <div className='hit-area-2 bg-brand flex flex h-4 w-4'>Hello</div>;\n}\n",
      'apps/web/src/components/ui/bad.tsx':
        "export function Bad() {\n  return <div className='itms-center'>Hello</div>;\n}\n",
    })
    expect(result.output).toContain('tailwindcss(no-duplicate-classes)')
    expect(result.output).toContain('tailwindcss(enforce-shorthand)')
    expect(result.output).toContain('shadcn(no-unknown-classes)')
    const path = resolve(result.root, 'apps/web/src/components/ui/card.tsx')
    const args = [binary, '-c', resolve(result.root, 'oxlint.config.ts'), '--fix', '--format', 'json', path]
    let stable = false
    const passes: string[] = []
    for (let pass = 0; pass < 8; pass++) {
      const before = readFileSync(path, 'utf8')
      const fixed = spawnSync(process.execPath, args, { cwd: result.root, encoding: 'utf8' })
      passes.push(readFileSync(path, 'utf8'))
      if (readFileSync(path, 'utf8') === before) {
        expect(fixed.status, fixed.stdout + fixed.stderr).toBe(0)
        stable = true
        break
      }
    }
    expect(stable, `Tailwind fixes must converge within eight passes: ${JSON.stringify(passes)}`).toBe(true)
    const source = readFileSync(path, 'utf8')
    expect(source).toContain('size-4')
    expect(source).toContain('bg-brand')
    expect(source).toContain('hit-area-2')
    const repeated = spawnSync(process.execPath, args, { cwd: result.root, encoding: 'utf8' })
    expect(repeated.status, repeated.stdout + repeated.stderr).toBe(0)
    expect(readFileSync(path, 'utf8')).toBe(source)
  })

  test('default React, Tailwind and shadcn plugins lint a real component', () => {
    const result = fixture("tailwind: { cssEntryPoint: 'apps/web/src/application/styles.css' },", {
      'apps/web/src/application/styles.css': '@import "tailwindcss";\n',
      'apps/web/src/components/chat/chat-message.tsx':
        "export function ChatMessage() {\n  return <div className='flex'>Hello</div>;\n}\n",
    })
    expect(result.status, result.output).toBe(0)
  })

  test('caller opacity is allowed without allowing other appearance or arbitrary opacity', () => {
    const result = fixture("tailwind: { cssEntryPoint: 'apps/web/src/application/styles.css' },", {
      'apps/web/src/application/styles.css': '@import "tailwindcss";\n',
      'apps/web/src/components/ui/button.tsx':
        "export function Button({ className, ...props }: React.ComponentProps<'button'>) { return <button className={['rounded-md bg-black text-white', className].join(' ')} {...props} />; }\n",
      'apps/web/src/components/chat/chat-message.tsx': `import { Button } from '@/components/ui/button';
export function ChatMessage() {
  return <><Button className="opacity-70 md:opacity-0 hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100" /><Button className="shadow-sm blur-sm text-red-500" /><Button className="opacity-[0.37]" /></>;
}
`,
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    const restyles = output.diagnostics.filter((entry) => entry.code === 'shadcn(no-restyle)')
    expect(restyles).toHaveLength(3)
    expect(restyles.map((entry) => entry.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"shadow-sm"'),
        expect.stringContaining('"blur-sm"'),
        expect.stringContaining('"text-red-500"'),
      ]),
    )
    expect(output.diagnostics.filter((entry) => entry.code === 'shadcn(no-arbitrary-values)')).toHaveLength(1)
  })

  test('stock composition contracts allow every padding/gap group and retain layout, opacity and truncation', () => {
    const padding = ['p-4', 'px-4', 'py-4', 'ps-4', 'pe-4', 'pt-4', 'pr-4', 'pb-4', 'pl-4']
    const gap = ['gap-4', 'gap-x-4', 'gap-y-4']
    const cases = {
      CardContent: padding,
      PopoverContent: padding,
      TabsContent: [...gap, ...padding],
      Tabs: gap,
      HoverCardContent: gap,
      SidebarHeader: gap,
      BreadcrumbList: gap,
      Button: [],
    }
    const names = Object.keys(cases)
    const result = fixture("tailwind: { cssEntryPoint: 'apps/web/src/application/styles.css' },", {
      'apps/web/src/application/styles.css': '@import "tailwindcss";\n',
      'apps/web/src/components/ui/composition.tsx': names.map((name) =>
        `export function ${name}({ className, ...props }: React.ComponentProps<'div'>) { return <div className={className} {...props} />; }`,
      ).join('\n'),
      'apps/web/src/components/chat/chat-message.tsx': `import { ${names.join(', ')} } from '@/components/ui/composition';
export function ChatMessage() {
  return <>${Object.entries(cases).flatMap(([name, classes]) =>
    [...classes, 'w-full', 'opacity-70', 'truncate', 'md:truncate'].map((value) => `<${name} className="${value}" />`),
  ).join('')}</>;
}
`,
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(output.diagnostics.filter((entry) => entry.code.startsWith('shadcn(')), result.output).toEqual([])
  })

  test('stock composition contracts keep controls, other slots and non-composition appearance protected', () => {
    const padding = ['p-4', 'px-4', 'py-4', 'ps-4', 'pe-4', 'pt-4', 'pr-4', 'pb-4', 'pl-4']
    const gap = ['gap-4', 'gap-x-4', 'gap-y-4']
    const cases = {
      Button: [...padding, ...gap, 'text-ellipsis', 'text-red-500'],
      Card: padding,
      CustomContent: padding,
      Tabs: padding,
      HoverCardContent: padding,
      SidebarHeader: padding,
      BreadcrumbList: padding,
      CardContent: [...gap, 'rounded-xl', 'bg-red-500'],
      PopoverContent: gap,
      TabsContent: ['rounded-xl', 'bg-red-500'],
    }
    const names = Object.keys(cases)
    const result = fixture("tailwind: { cssEntryPoint: 'apps/web/src/application/styles.css' },", {
      'apps/web/src/application/styles.css': '@import "tailwindcss";\n',
      'apps/web/src/components/ui/composition.tsx': names.map((name) =>
        `export function ${name}({ className, ...props }: React.ComponentProps<'div'>) { return <div className={className} {...props} />; }`,
      ).join('\n'),
      'apps/web/src/components/chat/chat-message.tsx': `import { ${names.join(', ')} } from '@/components/ui/composition';
export function ChatMessage() {
  return <>${Object.entries(cases).flatMap(([name, classes]) =>
    classes.map((value) => `<${name} className="${value}" />`),
  ).join('')}</>;
}
`,
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(output.diagnostics.filter((entry) => entry.code === 'shadcn(no-restyle)'), result.output).toHaveLength(
      Object.values(cases).flat().length,
    )
  })

  test('safe-area allowances cover four insets on padding groups and scale-based floors on sides/axes', () => {
    const padding = ['p', 'px', 'py', 'ps', 'pe', 'pt', 'pr', 'pb', 'pl']
    const classes = padding.flatMap((group) => ['top', 'right', 'bottom', 'left'].flatMap((side) => [
      `${group}-[env(safe-area-inset-${side})]`,
      ...(group === 'p' ? [] : [`${group}-[max(--spacing(4),env(safe-area-inset-${side}))]`]),
    ]))
    classes.push('md:pb-[max(--spacing(2.5),env(safe-area-inset-bottom))]')
    const result = fixture("tailwind: { cssEntryPoint: 'apps/web/src/application/styles.css' },", {
      'apps/web/src/application/styles.css': '@import "tailwindcss";\n',
      'apps/web/src/components/chat/chat-message.tsx': `export function ChatMessage() {
  return <>${classes.map((value) => `<div className="${value}" />`).join('')}</>;
}
`,
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(output.diagnostics.filter((entry) => entry.code === 'shadcn(no-arbitrary-values)'), result.output).toEqual([])
  })

  test('safe-area allowances reject unrelated values, malformed boundaries and off-token arithmetic', () => {
    const classes = [
      'pt-[env(safe-area-inset-middle)]',
      'pt-[env(safe-area-inset-top,13px)]',
      'pt-[env(safe-area-inset-top)+13px]',
      'pt-[calc(env(safe-area-inset-top)+13px)]',
      'pt-[env(safe-area-inset-top]',
      'pt-[env(safe-area-inset-top))]',
      'pb-[max(1rem,env(safe-area-inset-bottom))]',
      'pb-[max(13px,env(safe-area-inset-bottom))]',
      'pb-[max(--spacing(),env(safe-area-inset-bottom))]',
      'pb-[max(--spacing(4),env(safe-area-inset-middle))]',
      'pb-[max(--spacing(4),env(safe-area-inset-bottom),13px)]',
      'p-[max(--spacing(4),env(safe-area-inset-bottom))]',
      'bg-[env(safe-area-inset-top)]',
    ]
    const result = fixture("tailwind: { cssEntryPoint: 'apps/web/src/application/styles.css' },", {
      'apps/web/src/application/styles.css': '@import "tailwindcss";\n',
      'apps/web/src/components/chat/chat-message.tsx': `export function ChatMessage() {
  return <>${classes.map((value) => `<div className="${value}" />`).join('')}</>;
}
`,
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    const arbitrary = output.diagnostics.filter((entry) => entry.code === 'shadcn(no-arbitrary-values)')
    expect(arbitrary, result.output).toHaveLength(classes.length)
    for (const value of classes) expect(arbitrary.some((entry) => entry.message.includes(`"${value}"`)), value).toBe(true)
  })

  test('safe-area scale globs are not a CSS-expression validator or a no-restyle exemption', () => {
    const result = fixture("tailwind: { cssEntryPoint: 'apps/web/src/application/styles.css' },", {
      'apps/web/src/application/styles.css': '@import "tailwindcss";\n',
      'apps/web/src/components/ui/button.tsx':
        "export function Button({ className, ...props }: React.ComponentProps<'button'>) { return <button className={className} {...props} />; }\n",
      'apps/web/src/components/chat/chat-message.tsx': `import { Button } from '@/components/ui/button';
export function ChatMessage() {
  return <><div className="pb-[max(--spacing(bogus),env(safe-area-inset-bottom))]" /><div className="pb-[max(--spacing(4)+13px),env(safe-area-inset-bottom))]" /><Button className="pb-[env(safe-area-inset-bottom)]" /></>;
}
`,
    })
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(output.diagnostics.filter((entry) => entry.code === 'shadcn(no-arbitrary-values)'), result.output).toEqual([])
    expect(output.diagnostics.filter((entry) => entry.code === 'shadcn(no-restyle)'), result.output).toHaveLength(1)
  })

  test('Sonner selector hooks are allowed only in the stock UI file for each configured web root', () => {
    const files: Record<string, string> = {}
    for (const root of ['dashboard', 'storefront']) {
      files[`${root}/src/application/styles.css`] = '@import "tailwindcss";\n'
      files[`${root}/src/components/ui/sonner.tsx`] =
        'export function Sonner() { return <div className="toaster toast misspelled-hook" />; }\n'
      files[`${root}/src/components/ui/other.tsx`] =
        'export function Other() { return <div className="toaster toast" />; }\n'
      files[`${root}/src/components/chat/sonner.tsx`] =
        'export function Sonner() { return <div className="toaster toast" />; }\n'
    }
    const result = fixture("architecture: { dashboard: 'web', storefront: 'web', api: 'server' }, tailwind: {},", files)
    const output: PresetFixtureOutput = JSON.parse(result.output)
    const unknown = output.diagnostics.filter((entry) => entry.code === 'shadcn(no-unknown-classes)')
    for (const root of ['dashboard', 'storefront']) {
      const sonner = unknown.filter((entry) => entry.filename === `${root}/src/components/ui/sonner.tsx`)
      expect(sonner, result.output).toHaveLength(1)
      expect(sonner[0]?.message).toContain('misspelled-hook')
      for (const file of ['ui/other.tsx', 'chat/sonner.tsx'])
        expect(unknown.filter((entry) => entry.filename === `${root}/src/components/${file}`), result.output).toHaveLength(2)
    }
    expect(unknown).toHaveLength(10)
    const config = tanstackStartReactModulesPreset({ architecture: { '.': 'web' }, severity: 'warn' })
    const sonner = config.overrides!.find((entry) => entry.files.includes('src/components/ui/sonner.tsx'))
    expect(sonner?.rules?.['shadcn/no-unknown-classes']).toEqual(['warn', { allow: ['toaster', 'toast'] }])
    expect(JSON.stringify(tanstackStartReactModulesPreset({ architecture: { dashboard: 'web', api: 'server' } })))
      .not.toContain('api/src/components/ui/sonner.tsx')
    for (const options of [{ shadcn: false }, { tailwind: false }, { policies: { shadcn: false } }] as const)
      expect(JSON.stringify(tanstackStartReactModulesPreset(options))).not.toContain('toaster')
  })

  test('scripts can use console output and reasoned inline exceptions', () => {
    const result = fixture('', {
      'scripts/report.ts': "console.log('ready');\n",
    })
    expect(result.status, result.output).toBe(0)
    const reasoned = fixture('architecture: { "apps/server": "server" },\n  policies: { typePlacement: false },', {
      'apps/server/src/lib/user.ts':
        '// oxlint-disable-next-line modules/shape-suffix -- Matches an external contract.\nexport interface UserShape {\n  id: string;\n}\n',
    })
    expect(reasoned.output).not.toContain('modules(shape-suffix)')
    expect(reasoned.output).not.toContain('reasoned-directives')
  })

  test('a valid backend mini project passes', () => {
    const result = fixture('architecture: { "apps/server": "server" },', {
      'apps/server/src/types/chat.types.ts': 'export interface ChatSendParams {\n  text: string;\n}\n',
      'apps/server/src/services/chat/chat-action.send.ts':
        "import type { ChatSendParams } from '../../types/chat.types';\n\nexport function chatActionSend(params: ChatSendParams) {\n  if (!params.text) {\n    return 'empty';\n  }\n\n  return params.text.trim();\n}\n",
    })
    expect(result.status, result.output).toBe(0)
  })

  test('policies.typePlacement false removes the whole policy without disabling unknown checks', () => {
    const files = {
      'apps/server/src/lib/user.ts': 'export interface User {\n  id: string;\n}\n',
    }
    expect(fixture('architecture: { "apps/server": "server" },', files).output).toContain('no-type-declarations')
    expect(
      fixture('architecture: { "apps/server": "server" },\n  policies: { typePlacement: false },', files).output,
    ).not.toContain('no-type-declarations')
    expect(
      fixture('architecture: { "apps/server": "server" },\n  policies: { typePlacement: false },', {
        'apps/server/src/lib/user.ts': 'export type User = unknown;\n',
      }).output,
    ).toContain('no-unknown')
  })

  test('policy callbacks and per-rule exclusions do not leak to other files', () => {
    const files = {
      'apps/server/src/lib/portable.ts': 'export interface Portable {\n  id: string;\n}\n',
      'apps/server/src/lib/user.ts': 'export interface User {\n  id: string;\n}\n',
    }
    const result = fixture(
      "architecture: { 'apps/server': 'server' },\n  policies: { typePlacement: (current) => current.map((scope) => ({ ...scope, excludeFiles: [...(scope.excludeFiles ?? []), '**/portable.ts'] })) },",
      files,
    )
    const parsed = JSON.parse(result.output)
    const diagnostics = parsed.diagnostics.filter((entry: { code: string }) =>
      entry.code.includes('no-type-declarations'),
    )
    expect(diagnostics).toHaveLength(1)
    expect(JSON.stringify(diagnostics)).toContain('user.ts')
    const excluded = fixture(
      "architecture: { 'apps/server': 'server' },\n  ruleExclusions: { 'arch/no-type-declarations': ['**/lib/**'] },",
      files,
    )
    expect(excluded.output).not.toContain('no-type-declarations')
  })

  test('warn level keeps options and a configurable architecture', () => {
    const result = fixture("severity: 'warn',\n  architecture: { backend: 'server' },", {
      'backend/src/lib/user.ts': 'export type User = unknown;\n',
    })
    expect(result.status, result.output).toBe(0)
    expect(result.output).toContain('no-unknown')
    expect(result.output).not.toContain('"severity": "error"')
  })

  test('rejects deep service folders and extra private helpers', () => {
    const result = fixture('architecture: { "apps/server": "server" },', {
      'apps/server/src/services/chat/messages/chat-action.send.ts':
        'export function chatActionSend() {\n  return 1;\n}\n',
      'apps/server/src/services/chat/chat-action.read.ts':
        'function chatBuild() {\n  return 1;\n}\n\nexport function chatActionRead() {\n  return chatBuild() + 1;\n}\n',
    })
    expect(result.output).toContain('no-restricted-files')
    expect(result.output).toContain('service-functions')
  })

  test('action/query scopes enforce a single export while frontend operations allow local helpers', () => {
    const files = {
      'backend/src/services/chat/chat-action.send.ts':
        'export function chatActionSend() { const local = () => 1; return local() + 2; }',
      'backend/src/services/chat/chat-query.read.ts':
        'export function chatQueryRead() { function local() { return 1; } return local() + 2; }',
      'worker/src/services/chat/chat-action.send.ts':
        'export function chatActionSend() { const local = () => 1; return local() + 2; }',
      'backend/src/services/chat/chat.service.ts':
        'export function makeChatService() { const local = () => 1; return { local }; }',
      'frontend/src/services/chat/chat.client.ts':
        'export function chatRead() { const local = () => 1; return local() + 2; }',
      'backend/src/services/chat/chat.utils.ts':
        'export function chatFirst() { return 1; } export function chatSecond() { return 2; }',
      'backend/src/services/chat/chat-action.extra.ts':
        'export function chatActionExtra() { return 1; } export const extra = 2;',
    }
    const result = fixture("architecture: { backend: 'server', frontend: 'web', worker: 'runner' },", files)
    const output: PresetFixtureOutput = JSON.parse(result.output)
    expect(
      output.diagnostics
        .filter((entry) => entry.code === 'modules(service-functions)')
        .map((entry) => entry.filename)
        .sort(),
    ).toEqual(['backend/src/services/chat/chat-action.extra.ts', 'backend/src/services/chat/chat.service.ts'])
    expect(result.output).toContain('genuinely shared')
  })

  test('type-only frontend imports cannot bypass backend boundaries', () => {
    const result = fixture('', {
      'apps/web/src/types/user.types.ts':
        "import type { User } from '../../../server/src/types/user.types';\n\nexport type UserId = User['id'];\n",
    })
    expect(result.output).toContain('import-boundaries')
  })

  test('React policies coexist with import boundaries and permit test IDs', () => {
    const result = fixture('', {
      'apps/web/src/components/chat/chat-message.tsx':
        "import { useMemo as cache } from 'react';\n\nexport function ChatMessage() {\n  return <div data-testid='message'>{cache(() => 'hello', [])}</div>;\n}\n",
    })
    expect(result.output).toContain('memoization')
    expect(result.output).not.toContain('Do not use data-testid')
  })

  test('valid shape words are allowed while the Shape suffix is rejected', () => {
    const result = fixture('architecture: { "apps/server": "server" },\n  policies: { typePlacement: false },', {
      'apps/server/src/lib/image.ts':
        'export interface ImageShape {\n  width: number;\n}\n\nexport function reshapeImage() {\n  return 1;\n}\n',
    })
    const diagnostics = JSON.parse(result.output).diagnostics.filter((entry: { code: string }) =>
      entry.code.includes('shape-suffix'),
    )
    expect(diagnostics).toHaveLength(1)
  })

  test('native consumer overrides remain available', () => {
    const result = fixture('', {
      'oxlint.config.ts': `import { defineConfig } from 'oxlint';\nimport preset from ${JSON.stringify(resolve(repository, 'dist/presets/tanstack-start-react-modules-preset.js'))};\nexport default defineConfig({ options: { typeAware: true }, extends: [preset({ root: import.meta.dirname, architecture: { "apps/server": "server" }, tailwind: false })], overrides: [{ files: ['**/lib/**'], rules: { 'arch/no-type-declarations': 'off' } }] });\n`,
      'apps/server/src/lib/user.ts': 'export interface User {\n  id: string;\n}\n',
    })
    expect(result.output).not.toContain('no-type-declarations')
  })

  test('construction does not mutate caller options or earlier results', () => {
    const options = {
      architecture: { 'apps/server': 'server' as const },
      ignorePatterns: ['vendor/**'],
    }
    const a = tanstackStartReactModulesPreset(options)
    a.ignorePatterns?.push('new/**')
    expect(tanstackStartReactModulesPreset(options).ignorePatterns).not.toContain('new/**')
    expect(options.ignorePatterns).toEqual(['vendor/**'])
  })

  test('the package export is available after building', () => {
    const output = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset'; console.log(typeof preset)",
      ],
      { cwd: repository, encoding: 'utf8' },
    )
    expect(output.trim()).toBe('function')
  })

  test('standalone frontend roots apply the same rules', () => {
    const result = fixture("architecture: { '.': 'web' },", {
      'src/hooks/use-chat.ts':
        "import { useEffect } from 'react';\n\nexport function useChat() {\n  useEffect(() => {}, []);\n}\n",
    })
    expect(result.output).toContain('empty-effect')
    const disabled = fixture("architecture: { '.': 'web' },\n  policies: { effects: false },", {
      'src/hooks/use-chat.ts':
        "import { useEffect } from 'react';\n\nexport function useChat() {\n  useEffect(() => {}, []);\n}\n",
    })
    expect(disabled.output).not.toContain('empty-effect')
  })

  test('keeps exported props interfaces and rejects component-local aliases', () => {
    const result = fixture('', {
      'apps/web/src/components/chat/chat-message.tsx':
        'export interface ChatMessageProps {\n  text: string;\n}\n\nexport function ChatMessage({ text }: ChatMessageProps) {\n  return <div>{text}</div>;\n}\n',
    })
    expect(result.status, result.output).toBe(0)
    const invalid = fixture('', {
      'apps/web/src/components/chat/chat-message.tsx':
        "type ChatMessageStatus = 'idle' | 'busy';\n\nexport function ChatMessage() {\n  return <div>Hello</div>;\n}\n",
    })
    expect(invalid.output).toContain('local-type-alias')
  })

  test('component props use a same-file <Component>Props interface only in component scope', () => {
    const inline = 'export function ProbeCard({ title }: { title: string }) {\n  return <h2>{title}</h2>;\n}\n'
    const result = fixture('', {
      'apps/web/src/components/probe/probe-card.tsx':
        "import { memo } from 'react';\n\ninterface ProbeCardProps {\n  title: string;\n}\n\nexport function ProbeCard({ title }: ProbeCardProps) {\n  return <button onClick={(event: { detail: number }) => event.detail}>{title}</button>;\n}\n\ninterface ProbeCardInlineOptions {\n  label: string;\n}\n\nexport const ProbeCardInline = ({ label }: ProbeCardInlineOptions) => <span>{label}</span>;\n\ninterface ProbeCardMemoProps {\n  label: string;\n}\n\ninterface ProbeCardBadgeProps {\n  tone: string;\n}\n\nexport const ProbeCardMemo = memo(({ label }: ProbeCardMemoProps) => <p>{label}</p>);\n\nfunction ProbeCardBadge({ tone }: ProbeCardBadgeProps) {\n  return <i>{tone}</i>;\n}\n",
      'apps/web/src/components/probe/probe-badge.tsx': inline.replace('ProbeCard', 'ProbeBadge'),
      'apps/web/src/components/rooms/rooms-chat-tools.tsx':
        'interface RoomsChatToolProps {\n  label: string;\n}\n\nfunction RoomsChatTool({ label }: RoomsChatToolProps) {\n  return <li>{label}</li>;\n}\n\nexport function RoomsChatTools() {\n  return <RoomsChatTool label="x" />;\n}\n',
      'apps/web/src/components/ui/probe-card.tsx': inline,
      'apps/web/src/components/probe/probe-card.test.tsx': inline,
      'apps/web/src/hooks/use-probe.ts': 'export function useProbe({ id }: { id: string }) {\n  return id;\n}\n',
    })
    const diagnostics = JSON.parse(result.output).diagnostics.filter((entry: { code: string }) =>
      entry.code.includes('component-props'),
    )
    expect(
      diagnostics
        .map((entry: { filename: string; message: string }) => [entry.filename, entry.message])
        .sort(([left]: string[], [right]: string[]) => left.localeCompare(right)),
    ).toEqual([
      [
        'apps/web/src/components/probe/probe-badge.tsx',
        "'ProbeBadge' props are typed inline. Declare `interface ProbeBadgeProps` directly above it and use that.",
      ],
      [
        'apps/web/src/components/probe/probe-card.tsx',
        "'ProbeCardInline' props must use `interface ProbeCardInlineProps` declared directly above it, not 'ProbeCardInlineOptions'.",
      ],
      [
        'apps/web/src/components/probe/probe-card.tsx',
        "Move `interface ProbeCardMemoProps` directly above 'ProbeCardMemo', with only blank lines between them.",
      ],
      [
        'apps/web/src/components/probe/probe-card.tsx',
        "Move `interface ProbeCardBadgeProps` directly above 'ProbeCardBadge', with only blank lines between them.",
      ],
      [
        'apps/web/src/components/rooms/rooms-chat-tools.tsx',
        "Local component 'RoomsChatTool' would need `interface RoomsChatToolProps`, which breaks the file prefix 'RoomsChatTools'. Rename the component to start with 'RoomsChatTools' (for example 'RoomsChatToolsItem').",
      ],
    ])
  })

  test('react.componentProps toggles only component-props', () => {
    const files = {
      'apps/web/src/components/probe/probe-card.tsx':
        "type ProbeCardTone = 'calm';\n\nexport function ProbeCard({ title }: { title: string }) {\n  return <h2>{title}</h2>;\n}\n",
    }
    const enabled = fixture('', files)
    expect(enabled.output).toContain('component-props')
    expect(enabled.output).toContain('local-type-alias')
    const disabled = fixture('react: { componentProps: false },', files)
    expect(disabled.output).not.toContain('component-props')
    expect(disabled.output).toContain('local-type-alias')
  })

  test('pass-through components use ComponentProps instead of an empty props interface', () => {
    const header = (props: string) =>
      `import type { ComponentProps } from 'react';\n\n${props}export function ProbeHeader(props: ${props ? 'ProbeHeaderProps' : "ComponentProps<'header'>"}) {\n  return <header {...props} />;\n}\n`
    const passThrough = fixture('', { 'apps/web/src/components/probe/probe-header.tsx': header('') })
    expect(passThrough.status, passThrough.output).toBe(0)
    const empty = fixture('', {
      'apps/web/src/components/probe/probe-header.tsx': header("interface ProbeHeaderProps extends ComponentProps<'header'> {}\n\n"),
    })
    expect(empty.output).toContain('no-empty-object-type')
    expect(empty.output).not.toContain('component-props')
    const adds = fixture('', {
      'apps/web/src/components/probe/probe-header.tsx':
        "import type { ComponentProps } from 'react';\n\nexport function ProbeHeader(props: Omit<ComponentProps<'header'>, 'title'>) {\n  return <header {...props} />;\n}\n",
    })
    expect(adds.output).toContain("'ProbeHeader' props must use `interface ProbeHeaderProps`")
  })

  test('requires output schemas only in configured public API scopes', () => {
    const code = 'export const chat = rpc.handler(() => 1);\n'
    const result = fixture(
      "architecture: { 'apps/server': 'server' },\n  orpc: { publicProcedureFiles: ['apps/server/src/rpc/public/**'] },",
      {
        'apps/server/src/rpc/public/chat.ts': code,
        'apps/server/src/rpc/internal/chat.ts': code,
      },
    )
    const diagnostics = JSON.parse(result.output).diagnostics.filter((entry: { code: string }) =>
      entry.code.includes('require-orpc-output'),
    )
    expect(diagnostics).toHaveLength(1)
    expect(JSON.stringify(diagnostics)).toContain('public/chat.ts')
  })

  test('Dillon rules load under their attributed namespace', () => {
    const result = fixture('architecture: { "apps/server": "server" },', {
      'apps/server/src/services/chat/chat-action.send.ts':
        'export function chatActionSend() {\n  return Reflect.get({}, "id");\n}\n',
    })
    expect(result.output).toContain('dillon-anti-slop(no-reflect-get)')
  })

  test('custom import aliases preserve boundaries and approved entry points', () => {
    const result = fixture("imports: { aliases: { '@backend': 'apps/server/src' } },", {
      'apps/web/src/types/chat.types.ts':
        "import type { Chat } from '@backend/types/chat.types';\n\nexport type ChatId = Chat['id'];\n",
      'apps/web/src/types/user.types.ts':
        "import type { User } from '@fixture/server/client';\n\nexport type UserId = User['id'];\n",
    })
    const diagnostics = JSON.parse(result.output).diagnostics.filter((entry: { code: string }) =>
      entry.code.includes('import-boundaries'),
    )
    expect(diagnostics).toHaveLength(1)
    expect(JSON.stringify(diagnostics)).toContain('chat.types.ts')
  })

  test('disabled naming and import policies do not retain their base rules', () => {
    const config = tanstackStartReactModulesPreset({
      policies: { naming: false, imports: false },
    })
    const rules = {
      ...config.rules,
      ...Object.assign({}, ...config.overrides!.map((entry) => entry.rules)),
    }
    expect(rules['unicorn/filename-case']).toBeUndefined()
    expect(rules['perfectionist/sort-imports']).toBeUndefined()
    expect(rules['perfectionist/sort-named-imports']).toBeUndefined()
  })
})
