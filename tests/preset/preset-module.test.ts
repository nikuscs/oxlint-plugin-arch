import { describe, expect, it } from 'vitest'
import { testerPreset } from '../utils/tester.utils.ts'
import type { TesterPresetRow } from '../types/tester.types.ts'

describe('preset Effect module package', () => {
  const manifest = (name: string) => JSON.stringify({ name, dependencies: { effect: '1' } })
  const tree = ['packages/kit-wallet/src/migrations/', 'packages/kit-wallet/test/support/', 'packages/kit-wallet/test/fixtures/vinext-app/src/', 'packages/kit-wallet/testing/', 'packages/kit-utils/src/errors/', 'packages/kit-utils/test/']

  const files = {
    'package.json': JSON.stringify({ workspaces: ['packages/*'] }),
    'packages/kit-wallet/package.json': manifest('@scope/kit-wallet'),
    'packages/kit-utils/package.json': manifest('@scope/kit-utils'),
    'packages/kit-wallet/src/index.ts': '',
    'packages/kit-utils/src/errors/tagged.ts': '',
  }

  const kit = { effect: { module: 'kit-{module}' } }
  const row = (file: string, rule: string, expected: unknown, folders: TesterPresetRow['folders'] = { 'packages/*': kit }): Omit<TesterPresetRow, 'name'> => ({ tree, files, folders, file, rule, expected })
  const template = (expected: unknown) => ['error', expect.objectContaining({ template: expected })]
  const spans = (pattern: string) => ['error', { labels: [{ callee: 'Effect.fn', pattern }] }]
  const method = '[a-z][A-Za-z0-9]*(?:\\.[a-z][A-Za-z0-9]*)*'

  it.each<TesterPresetRow>([
    { name: 'a package without the option gets no layout', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/effect-yields-first', undefined, { 'packages/*': { effect: true } }) },
    { name: 'a folder off the name template gets no layout', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/effect-yields-first', undefined, { 'packages/*': { effect: { module: 'lib-{module}' } } }) },
    { name: 'a module names its source files', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-file', template(expect.arrayContaining(['src/index.ts', 'src/wallet.ts', 'src/wallet.layer.ts', 'src/wallet-{part}.driver.ts', 'src/wallet.translations-{any}.ts']))) },
    { name: 'a module has no part for a kind outside parts', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-file', template(expect.not.arrayContaining(['src/wallet-{part}.config.ts']))) },
    { name: 'kinds adds and removes file kinds', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-file', template(expect.arrayContaining(['src/wallet.policy.ts'])), { 'packages/*': { effect: { module: { name: 'kit-{module}', kinds: ['*.policy.ts', '!*.middlewares.ts'] } } } }) },
    { name: 'a removed kind is gone', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-file', template(expect.not.arrayContaining(['src/wallet.middlewares.ts'])), { 'packages/*': { effect: { module: { name: 'kit-{module}', kinds: ['!*.middlewares.ts'] } } } }) },
    { name: 'parts adds a kind that may be split', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-file', template(expect.arrayContaining(['src/wallet-{part}.utils.ts'])), { 'packages/*': { effect: { module: { name: 'kit-{module}', parts: ['*.utils.ts'] } } } }) },
    { name: 'a span starts with the module', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-labels', spans(`^wallet\\.${method}$`)) },
    { name: 'a span pattern of the project', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-labels', spans(`^database\\.${method}$`), { 'packages/*': kit, 'packages/kit-wallet': { effect: { module: { spans: 'database.{method}' } } } }) },
    { name: 'a narrower folder keeps the name template', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/effect-yields-first', 'error', { 'packages/*': kit, 'packages/kit-wallet': { effect: { module: { spans: 'database.{method}' } } } }) },
    { name: 'spans off', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-labels', undefined, { 'packages/*': { effect: { module: { name: 'kit-{module}', spans: false } } } }) },
    { name: 'yields set the yield names in a module', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/effect-yield-name', ['error', { names: { 'Kit.Database': 'db' } }], { 'packages/*': { effect: { module: 'kit-{module}', yields: { names: { 'Kit.Database': 'db' } } } } }) },
    { name: 'labels add entries to a module key', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-labels', ['error', { labels: [{ callee: 'Effect.fn', pattern: `^wallet\\.${method}$` }, { callee: 'Layer.effect', name: '{name}' }] }], { 'packages/*': { effect: { module: 'kit-{module}', labels: { '**/*.ts': [{ callee: 'Layer.effect', name: '{name}' }] } } } }) },
    { name: 'fixtures are foreign apps', ...row('packages/kit-wallet/test/fixtures/vinext-app/src/page.tsx', 'arch/naming-file', 'off', { 'packages/*': { effect: { module: { name: 'kit-{module}', tests: { fixtures: ['fixtures/vinext-*'] } } } } }) },
    { name: 'fixtures take async framework functions', ...row('packages/kit-wallet/test/fixtures/vinext-app/src/page.tsx', 'effecttsgo/async-function', 'off', { 'packages/*': { effect: { module: { name: 'kit-{module}', tests: { fixtures: ['fixtures/vinext-*'] } } } } }) },
    { name: 'fixtures leave other tests checked', ...row('packages/kit-wallet/test/wallet.test.ts', 'arch/naming-file', ['error', expect.any(Object), expect.any(Object)], { 'packages/*': { effect: { module: { name: 'kit-{module}', tests: { fixtures: ['fixtures/vinext-*'] } } } } }) },
    { name: 'a layer file exports its layer', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/files-exports', ['error', { names: ['layer'] }]) },
    { name: 'a layer file may build layers', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/boundaries-deny', ['error', expect.objectContaining({ calls: expect.not.objectContaining({ 'Layer.effect': expect.anything() }) })]) },
    { name: 'another file builds no layer', ...row('packages/kit-wallet/src/wallet.utils.ts', 'arch/boundaries-deny', ['error', expect.objectContaining({ calls: expect.objectContaining({ 'Layer.effect': 'Build layers in a .layer.ts, .driver.ts or .fake.ts file.' }) })]) },
    { name: 'a types file exports names of the module', ...row('packages/kit-wallet/src/wallet.types.ts', 'arch/files-exports', ['error', { patterns: ['Wallet(?!\\w*(?<!ss|us|is)sTable$)\\w*', '\\*'] }]) },
    { name: 'a support file keeps its top level lock', ...row('packages/kit-wallet/test/support/wallet.layer.ts', 'arch/files-top-level', ['error', expect.objectContaining({ deny: expect.arrayContaining(['type', 'interface']) })]) },
    { name: 'a support file keeps its file names', ...row('packages/kit-wallet/test/support/wallet.layer.ts', 'arch/naming-file', ['error', expect.objectContaining({ template: expect.arrayContaining(['support/wallet.layer.ts']) })]) },
    { name: 'a module may hold an unsplit driver, adapter and index file', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-file', template(expect.arrayContaining(['src/wallet.driver.ts', 'src/wallet.adapter.ts', 'src/wallet.index.ts']))) },
    {
      name: 'a dashed module re-exports its own part types files',
      tree: [...tree, 'packages/kit-activity-log/src/'],
      files: { ...files, 'packages/kit-activity-log/package.json': manifest('@scope/kit-activity-log') },
      folders: { 'packages/*': kit },
      file: 'packages/kit-activity-log/src/activity-log.types.ts',
      rule: 'arch/files-top-level',
      expected: ['error', expect.objectContaining({ deny: [{ kind: 'reexport', names: String.raw`^\./(?!activity-log-[a-z0-9-]+\.types\.ts$)` }] }), expect.any(Object)],
    },
    { name: 'a types file only re-exports its parts when it has them', ...row('packages/kit-wallet/src/wallet.types.ts', 'arch/files-top-level', ['error', expect.objectContaining({ deny: expect.any(Array) }), expect.objectContaining({ allow: ['import', 'reexport'], when: '{stem}-*.types.ts' })]) },
    { name: 'a config file holds config constants', ...row('packages/kit-wallet/src/wallet.config.ts', 'arch/files-top-level', ['error', { allow: ['import', { kind: 'const', exported: true, names: '^(?:config|[a-z]\\w*Config)$' }] }]) },
    { name: 'an index file re-exports only', ...row('packages/kit-wallet/src/index.ts', 'arch/files-top-level', ['error', { allow: ['import', 'reexport'] }]) },
    { name: 'a migration is dated and named after the module', ...row('packages/kit-wallet/src/migrations/a.ts', 'arch/naming-file', ['error', expect.objectContaining({ pattern: '^\\d{4}-\\d{2}-\\d{2}-\\d{2}-\\d{2}-create-wallet-tables(?:[.]sqlite)?[.]ts$' })]) },
    { name: 'a migration pattern of the project', ...row('packages/kit-wallet/src/migrations/a.ts', 'arch/naming-file', ['error', expect.objectContaining({ pattern: '^\\d{4}-\\d{2}-\\d{2}-\\d{2}-\\d{2}-wallet(?:[.]sqlite)?[.]ts$' })], { 'packages/*': { effect: { module: { name: 'kit-{module}', migrations: '{date}-{module}' } } } }) },
    { name: 'migrations off leaves the folder to the file rule', ...row('packages/kit-wallet/src/migrations/a.ts', 'arch/naming-file', template(expect.not.arrayContaining([expect.stringContaining('migrations/')])), { 'packages/*': { effect: { module: { name: 'kit-{module}', migrations: false } } } }) },
    { name: 'a test is named after the module', ...row('packages/kit-wallet/test/wallet.test.ts', 'arch/naming-file', ['error', expect.objectContaining({ template: expect.arrayContaining(['test/wallet.test.ts', 'test/wallet-{part}.{what}.bench.ts']) }), expect.objectContaining({ pattern: '^(?!.*[.]integration[.])' })]) },
    { name: 'a test file holds only test calls', ...row('packages/kit-wallet/test/wallet.test.ts', 'arch/files-top-level', ['error', { allow: ['import', 'describe*', 'it*', 'layer', '*Suite', '*.describe'] }]) },
    { name: 'a test of one source file needs that file', ...row('packages/kit-wallet/test/wallet.layer.test.ts', 'arch/files-siblings', ['error', { require: '../src/{stem}.layer.ts' }]) },
    { name: 'a support file is named after the module', ...row('packages/kit-wallet/test/support/wallet.cases.ts', 'arch/naming-file', template(['support/wallet.layer.ts', 'support/wallet-{part}.layer.ts', 'support/wallet.cases.ts', 'support/wallet-{part}.cases.ts', 'support/wallet.scenarios.ts', 'support/wallet-{part}.scenarios.ts', 'support/wallet-{part}.ts'])) },
    { name: 'factories sit in one file', ...row('packages/kit-wallet/testing/wallet.factories.ts', 'arch/naming-file', template('testing/wallet.factories.ts')) },
    { name: 'tests off', ...row('packages/kit-wallet/test/wallet.test.ts', 'arch/files-top-level', undefined, { 'packages/*': { effect: { module: { name: 'kit-{module}', tests: false } } } }) },
    { name: 'a tests folder of the project', tree: [...tree, 'packages/kit-wallet/tests/'], files, folders: { 'packages/*': { effect: { module: { name: 'kit-{module}', tests: { folder: 'tests' } } } } }, file: 'packages/kit-wallet/tests/wallet.test.ts', rule: 'arch/naming-file', expected: ['error', expect.objectContaining({ template: expect.arrayContaining(['tests/wallet.test.ts']) }), expect.any(Object)] },
    { name: 'imports are named after the package and the file', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-imports', ['error', { imports: expect.arrayContaining([{ source: '@scope/kit-{package}', name: '{Package}' }, { source: '@scope/kit-{package}/schema', name: '{Package}Types', namespace: false }, { source: '**/index.ts', name: false }, { source: '**/{file}.ts', name: '{File}', namespace: false, drop: '[.](?:driver|adapter|index)$' }]) }]) },
    { name: 'imports off', ...row('packages/kit-wallet/src/wallet.layer.ts', 'arch/naming-imports', undefined, { 'packages/*': { effect: { module: { name: 'kit-{module}', imports: false } } } }) },
    { name: 'a flat package names spans after the file', ...row('packages/kit-utils/src/http.ts', 'arch/naming-labels', spans(`^{stem}\\.${method}$`), { 'packages/*': kit, 'packages/kit-utils': { effect: { module: 'flat' } } }) },
    { name: 'a flat package has no file name rule of the layout', ...row('packages/kit-utils/src/http.ts', 'arch/naming-file', expect.not.arrayContaining([expect.objectContaining({ template: expect.anything() })]), { 'packages/*': kit, 'packages/kit-utils': { effect: { module: 'flat' } } }) },
    { name: 'error classes live in the listed files', ...row('packages/kit-utils/src/errors/wallet.ts', 'arch/files-top-level', ['error', { allow: ['import', { kind: 'class', exported: true }, { kind: 'const', exported: true }, 'type'] }], { 'packages/kit-utils': { effect: { errors: { files: 'src/errors/*.ts', base: 'src/errors/tagged.ts' } } } }) },
    { name: 'the base file may call the raw constructors', ...row('packages/kit-utils/src/errors/tagged.ts', 'arch/boundaries-deny', ['error', expect.objectContaining({ calls: expect.not.objectContaining({ 'Data.TaggedError': expect.anything() }) })], { 'packages/kit-utils': { effect: { errors: { files: 'src/errors/*.ts', base: 'src/errors/tagged.ts' } } } }) },
    { name: 'the base file has no top-level lock', ...row('packages/kit-utils/src/errors/tagged.ts', 'arch/files-top-level', 'off', { 'packages/kit-utils': { effect: { errors: { files: 'src/errors/*.ts', base: 'src/errors/tagged.ts' } } } }) },
    { name: 'another errors file may not call the raw constructors', ...row('packages/kit-utils/src/errors/wallet.ts', 'arch/boundaries-deny', ['error', expect.objectContaining({ calls: expect.objectContaining({ 'Data.TaggedError': expect.any(String) }) })], { 'packages/kit-utils': { effect: { errors: { files: 'src/errors/*.ts', base: 'src/errors/tagged.ts' } } } }) },
    { name: 'top off on errors file', ...row('packages/kit-utils/src/errors/tagged.ts', 'arch/files-top-level', 'off', { 'packages/kit-utils': { effect: { errors: { files: 'src/errors/*.ts' } } }, 'packages/kit-utils/src/errors/tagged.ts': { top: false } }) },
    { name: 'top off on index file', ...row('packages/kit-wallet/src/index.ts', 'arch/files-top-level', undefined, { 'packages/*': kit, 'packages/kit-wallet/src/index.ts': { top: false } }) },
  ])('$name', (given) => {
    expect({ value: testerPreset(given) }).toMatchObject({ value: given.expected })
  })
})
