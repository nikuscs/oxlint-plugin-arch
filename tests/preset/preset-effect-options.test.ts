import { describe, expect, it } from 'vitest'
import { testerPreset } from '../utils/tester.utils.ts'
import type { TesterPresetRow } from '../types/tester.types.ts'

describe('preset Effect options', () => {
  const manifest = (name: string, dependencies: Record<string, string>) => JSON.stringify({ name, dependencies })
  const workspaces = JSON.stringify({ workspaces: ['apps/*', 'packages/*'] })
  const tree = ['apps/server/src/domains/order/', 'apps/server/src/rpc/app/', 'apps/server/src/mails/']

  const server = {
    'package.json': workspaces,
    'apps/server/package.json': manifest('server', { effect: '1', kysely: '1' }),
    'apps/server/src/application/app.ts': '',
  }

  const contractTree = ['packages/contract/src/order/', 'packages/contract/src/shared/']

  const contract = {
    'package.json': workspaces,
    'packages/contract/package.json': manifest('contract', { effect: '1' }),
    'packages/contract/src/order/order.contract.ts': '',
  }

  it.each<TesterPresetRow>([
    { name: 'strict by area turns one area off', tree, files: { ...server, 'apps/server/tests/order.test.ts': '' }, folders: { 'apps/server': { effect: { strict: { tests: false } } } }, file: 'apps/server/tests/order.test.ts', rule: 'arch/files-top-level', expected: undefined },
    { name: 'strict by area keeps the other areas', tree, files: server, folders: { 'apps/server': { effect: { strict: { tests: false } } } }, file: 'apps/server/src/domains/order/order.actions.ts', rule: 'arch/files-top-level', expected: ['error', expect.any(Object)] },
    { name: 'strict by area turns the domains area off', tree, files: server, folders: { 'apps/server': { effect: { strict: { domains: false } } } }, file: 'apps/server/src/domains/order/order.actions.ts', rule: 'arch/files-top-level', expected: undefined },
    { name: 'strict by area turns the contract service area off', tree: contractTree, files: contract, folders: { 'packages/contract': { effect: { strict: { service: false } } } }, file: 'packages/contract/src/order/order.service.ts', rule: 'arch/effect-service-params', expected: undefined },
    { name: 'a server locks spec files in its test folders', tree, files: { ...server, 'apps/server/tests/order.spec.ts': '' }, folders: {}, file: 'apps/server/tests/order.spec.ts', rule: 'arch/files-top-level', expected: ['error', { allow: ['import', 'describe*', 'it*', 'test*', 'layer*'] }] },
    { name: 'server tests take other globs', tree, files: { ...server, 'apps/server/src/order.check.ts': '' }, folders: { 'apps/server': { effect: { server: { tests: ['src/**/*.check.ts'] } } } }, file: 'apps/server/src/order.check.ts', rule: 'arch/files-top-level', expected: ['error', { allow: ['import', 'describe*', 'it*', 'test*', 'layer*'] }] },
    { name: 'server tests set to false lock no test file', tree, files: { ...server, 'apps/server/tests/order.test.ts': '' }, folders: { 'apps/server': { effect: { server: { tests: false } } } }, file: 'apps/server/tests/order.test.ts', rule: 'arch/files-top-level', expected: undefined },
    { name: 'yields set the yield names on a server', tree, files: server, folders: { 'apps/server': { effect: { yields: { names: { 'Kit.Database': 'db' }, allow: '^layer' } } } }, file: 'apps/server/src/domains/order/order.actions.ts', rule: 'arch/effect-yield-name', expected: ['error', { names: { 'Kit.Database': 'db' }, allow: '^layer' }] },
    {
      name: 'labels add entries to a convention key',
      tree,
      files: server,
      folders: { 'apps/server': { effect: { labels: { 'domains/*/*.workflows.ts': [{ callee: 'Activity.make', name: '{name}' }] } } } },
      file: 'apps/server/src/domains/order/order.workflows.ts',
      rule: 'arch/naming-labels',
      expected: ['error', { labels: [{ callee: 'Workflow.make', name: '{name}', drop: 'Workflow$' }, { callee: 'Activity.make', property: 'name' }, { callee: 'Effect.fn', name: '{name}', within: '*.toLayer', loose: true }, { callee: 'Activity.make', name: '{name}' }] }],
    },
    { name: 'labels on another pattern are that file kind\'s labels', tree, files: server, folders: { 'apps/server': { effect: { labels: { 'domains/*/*.layer.ts': [{ callee: 'Layer.effect', name: '{name}' }] } } } }, file: 'apps/server/src/domains/order/order.layer.ts', rule: 'arch/naming-labels', expected: ['error', { labels: [{ callee: 'Layer.effect', name: '{name}' }] }] },
    { name: 'handlers allow keys on rpc handlers', tree, files: server, folders: { 'apps/server': { effect: { handlers: { allow: '^health$' } } } }, file: 'apps/server/src/rpc/app/rpc.app.orders.ts', rule: 'arch/naming-keys', expected: ['error', { exports: '^rpc[A-Z]', delegate: true, allow: '^health$' }] },
    { name: 'server folders open another source folder', tree: [...tree, 'apps/server/src/jobs/'], files: server, folders: { 'apps/server': { effect: { server: { folders: ['jobs'] } } } }, file: 'apps/server/src/jobs/nightly.ts', rule: 'arch/files-restricted', expected: undefined },
    { name: 'server folders name the places in the report', tree, files: server, folders: { 'apps/server': { effect: { server: { folders: ['jobs', '!mails'] } } } }, file: 'apps/server/src/helpers.ts', rule: 'arch/files-restricted', expected: ['error', { message: 'Server code lives in application/, domains/, rpc/ or jobs/.' }] },
    {
      name: 'server kinds add and remove domain file kinds',
      tree,
      files: server,
      folders: { 'apps/server': { effect: { server: { kinds: ['*.gateway.ts', '!*.prompts.ts'] } } } },
      file: 'apps/server/src/domains/order/order.gateway.ts',
      rule: 'arch/naming-file',
      expected: expect.arrayContaining([expect.objectContaining({ message: expect.stringMatching(/^Domain files use one of: (?!.*prompts).*[*][.]gateway[.]ts[.] /) })]),
    },
    { name: 'server operations rename the action word', tree, files: server, folders: { 'apps/server': { effect: { server: { operations: { actions: 'Command' } } } } }, file: 'apps/server/src/domains/order/order.actions.ts', rule: 'arch/files-exports', expected: ['error', { stem: 'folder', patterns: ['{domain}Command[A-Z]\\w*'], types: true }] },
    { name: 'server operations rename the layer keys', tree, files: server, folders: { 'apps/server': { effect: { server: { operations: { actions: 'Command' } } } } }, file: 'apps/server/src/domains/order/order.layer.ts', rule: 'arch/naming-keys', expected: ['error', expect.objectContaining({ name: '^{folder}(?:Command|Query){Path}$' })] },
    { name: 'server spans set to false drop the span check', tree, files: server, folders: { 'apps/server': { effect: { server: { spans: false } } } }, file: 'apps/server/src/domains/order/order.queries.ts', rule: 'arch/naming-labels', expected: undefined },
    {
      name: 'server rpc sets the handler file and export names',
      tree,
      files: server,
      folders: { 'apps/server': { effect: { server: { rpc: { file: '{group}/{area}.rpc.ts', names: ['{area}Rpc'] } } } } },
      file: 'apps/server/src/rpc/app/orders.rpc.ts',
      rule: 'arch/files-exports',
      expected: ['error', { file: '{area}.rpc.ts', names: ['{area}Rpc'] }],
    },
    { name: 'server rpc names the handler file in the report', tree, files: server, folders: { 'apps/server': { effect: { server: { rpc: { file: '{group}/{area}.rpc.ts' } } } } }, file: 'apps/server/src/rpc/app/orders.rpc.ts', rule: 'arch/naming-file', expected: expect.arrayContaining([expect.objectContaining({ message: 'Handlers use rpc/<group>/<area>.rpc.ts.' })]) },
    { name: 'contract kinds add a kind with its top level', tree: contractTree, files: contract, folders: { 'packages/contract': { effect: { contract: { kinds: { '*.policy.ts': ['type', { kind: 'const', exported: true }] } } } } }, file: 'packages/contract/src/order/order.policy.ts', rule: 'arch/files-top-level', expected: ['error', { stem: 'folder', allow: ['import', 'type', { kind: 'const', exported: true }] }] },
    { name: 'contract kinds remove a kind', tree: contractTree, files: contract, folders: { 'packages/contract': { effect: { contract: { kinds: { '*.schemas.ts': false } } } } }, file: 'packages/contract/src/order/order.contract.ts', rule: 'arch/naming-file', expected: ['error', expect.objectContaining({ message: expect.not.stringContaining('<d>.schemas.ts') })] },
    { name: 'contract root changes the files beside the folders', tree: contractTree, files: contract, folders: { 'packages/contract': { effect: { contract: { root: ['!index.ts', 'shared.ts'] } } } }, file: 'packages/contract/src/helpers.ts', rule: 'arch/naming-file', expected: ['error', expect.objectContaining({ message: 'A file beside the contract folders is contract.ts, contract.<name>.ts, errors.ts or shared.ts.' })] },
    { name: 'contract service sets the service key', tree: contractTree, files: contract, folders: { 'packages/contract': { effect: { contract: { service: '{package}:{name}' } } } }, file: 'packages/contract/src/order/order.service.ts', rule: 'arch/naming-labels', expected: ['error', { labels: [{ callee: 'Context.Service', name: 'contract:{name}' }] }] },
    { name: 'contract service set to false drops the service key', tree: contractTree, files: contract, folders: { 'packages/contract': { effect: { contract: { service: false } } } }, file: 'packages/contract/src/order/order.service.ts', rule: 'arch/naming-labels', expected: undefined },
    { name: 'errors tag and code shape the contract errors', tree: contractTree, files: contract, folders: { 'packages/contract': { effect: { errors: { tag: '{Name}Error', code: false } } } }, file: 'packages/contract/src/order/order.errors.ts', rule: 'arch/naming-labels', expected: ['error', { labels: [{ callee: ['Schema.TaggedErrorClass', 'Schema.TaggedError', 'Data.TaggedError'], name: '{Name}Error' }, { callee: '*.Tagged', property: 'tag', name: '{Name}Error' }] }] },
    { name: 'errors files take over the contract errors files', tree: contractTree, files: { ...contract, 'packages/contract/src/order/order.errors.ts': '' }, folders: { 'packages/contract': { effect: { errors: { files: 'src/*/*.errors.ts' } } } }, file: 'packages/contract/src/order/order.errors.ts', rule: 'arch/files-top-level', expected: ['error', { allow: ['import', { kind: 'class', exported: true }, { kind: 'const', exported: true }, 'type'] }] },
    { name: 'errors constructors and message set the error ban', tree, files: server, folders: { 'apps/server': { effect: { errors: { constructors: ['!Data.Error', 'Errors.make'], message: 'Errors live in errors files.' } } } }, file: 'apps/server/src/domains/order/order.actions.ts', rule: 'arch/boundaries-deny', expected: ['error', expect.objectContaining({ calls: expect.objectContaining({ 'Errors.make': 'Errors live in errors files.', 'Schema.TaggedError': 'Errors live in errors files.' }) })] },
    { name: 'errors constructors drop one from the ban', tree, files: server, folders: { 'apps/server': { effect: { errors: { constructors: ['!Data.Error'] } } } }, file: 'apps/server/src/domains/order/order.actions.ts', rule: 'arch/boundaries-deny', expected: ['error', expect.objectContaining({ calls: expect.not.objectContaining({ 'Data.Error': expect.any(String) }) })] },
    { name: 'layout folders restrict other folders under a source', tree: ['apps/web/src/lib/', 'apps/web/src/routes/'], files: { 'apps/web/package.json': manifest('web', { react: '1' }) }, folders: { 'apps/web': { layout: { folders: ['routes'] } } }, file: 'apps/web/src/lib/dates.ts', rule: 'arch/files-restricted', expected: ['error', { message: 'Folders here are routes/. Add a name to layout.folders.' }] },
    { name: 'layout folders let a listed folder through', tree: ['apps/web/src/lib/', 'apps/web/src/routes/'], files: { 'apps/web/package.json': manifest('web', { react: '1' }) }, folders: { 'apps/web': { layout: { folders: ['routes'] } } }, file: 'apps/web/src/routes/index.ts', rule: 'arch/files-restricted', expected: undefined },
    { name: 'layout folders on a narrower folder add and remove names', tree: ['apps/web/src/lib/', 'apps/web/src/routes/'], files: { 'apps/web/package.json': manifest('web', { react: '1' }) }, folders: { apps: { layout: { folders: ['lib'] } }, 'apps/web': { layout: { folders: ['routes', '!lib'] } } }, file: 'apps/web/src/lib/dates.ts', rule: 'arch/files-restricted', expected: ['error', { message: 'Folders here are routes/. Add a name to layout.folders.' }] },
  ])('$name', (row) => {
    expect({ value: testerPreset(row) }).toMatchObject({ value: row.expected })
  })

  it.each<{ name: string; folders: unknown; message: string }>([
    { name: 'an unknown strict area fails', folders: { 'apps/server': { effect: { strict: { jobs: false } } } }, message: 'Unknown effect.strict area `jobs`; use code, places, domains, rpc, mails, tests, kinds, service, errors.' },
    { name: 'server tests take strings', folders: { 'apps/server': { effect: { server: { tests: [1] } } } }, message: 'effect.server.tests takes a list of strings; `!` before one removes it.' },
    { name: 'labels take lists', folders: { 'apps/server': { effect: { labels: { 'domains/*/*.layer.ts': 'Layer.effect' } } } }, message: 'effect.labels maps a file pattern to a list of naming-labels entries.' },
  ])('$name', ({ folders, message }) => {
    const row = {
      name: 'bad',
      tree,
      files: server,
      // SAFETY: each row passes a wrong option on purpose, to read the error it raises.
      folders: folders as TesterPresetRow['folders'],
      file: 'apps/server/src/domains/order/order.actions.ts',
      rule: 'arch/files-top-level',
      expected: undefined,
    }

    expect(() => testerPreset(row)).toThrow(message)
  })
})
