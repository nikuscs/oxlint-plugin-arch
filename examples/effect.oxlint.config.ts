import { preset } from 'oxlint-plugin-arch/preset'

// An Effect monorepo: a server with domains/, a contract package and a React frontend.
// The preset already locks each file kind (see docs/groups/effect.md, "Locked by default").
// This config only adds the project's own choices on top.
export default preset({
  root: import.meta.dirname,
  // Lists named once and reused below as {kits}.
  sets: {
    kits: { 'kit-auth': 'auth', 'kit-payments': 'payment' },
  },
  folders: {
    '.': {
      deny: { imports: { '@acme/kit-queues': 'Workflows are the only background primitive.' } },
      // A kit import always takes the same name: `@acme/kit-auth` is `AuthKit`.
      naming: { imports: { '@acme/kit-{package}/{subpath}': '{Package}Kit{Subpath}', '@acme/kit-{package}': '{Package}Kit' } },
    },
    'apps/server/src': {
      // Each kit is used only by its own domain; everyone else calls that domain's service.
      deny: { only: [{ each: 'kits', imports: ['@acme/{key}', '@acme/{key}/!(schema)'], in: 'apps/server/src/domains/{value}', message: 'Call the {value} domain.' }] },
      // A yielded service is held in a const named after it; the database is `db`.
      rules: { 'arch/effect-yield-name': ['error', { names: { 'DatabaseKit.Database': 'db' }, allow: '^kit' }] },
    },
    // Two more file kinds a domain may hold.
    'apps/server/src/domains': { layout: { files: ['*.config.ts', '*.utils.ts'] } },
    // A handler calls the service method its key names; `apiKeys.*` calls a kit under other names.
    'apps/server/src/rpc/*/*.ts': { rules: { 'arch/naming-keys': ['error', { exports: '^rpc[A-Z]', delegate: true, allow: '^apiKeys\\.' }] } },
    // Workflow names, spans inside `X.toLayer(Effect.fn('…'))`, and kebab-case activity names.
    'apps/server/src/domains/*/*.workflows.ts': {
      rules: {
        'arch/naming-labels': [
          'error',
          {
            labels: [
              { callee: 'Workflow.make', name: '{name}', drop: 'Workflow$' },
              { callee: 'Effect.fn', name: '{name}', within: '*.toLayer', loose: true },
              { callee: 'Activity.make', property: 'name', pattern: '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$' },
            ],
          },
        ],
      },
    },
    // Each Schema's type follows in the type block; a filter (`…Valid`) is not a Schema and needs none.
    'packages/contract/src/*/*.schemas.ts': { rules: { 'arch/effect-schema-first': ['error', { allow: 'Valid$' }] } },
    'packages/contract/src/*/*.contract.ts': {
      rules: {
        // A procedure key is one lowercase singular word; nest for groups (`supplier: { product: … }`).
        'arch/naming-keys': ['error', { exports: 'Contract$', keys: '^(?:[a-z]+(?<!(?<!s)s)|status)$' }],
        // Off, kept with its options so the choice stays visible: inputs are shared across procedures.
        'arch/naming-pairs': ['off', { pairs: [{ methods: ['input', 'output'], strip: ['Input$', 'Output$'] }] }],
      },
    },
    // A domain not moved to the server yet has no service beside its contract.
    'packages/contract/src/{legacy,report}/*.contract.ts': { rules: { 'arch/files-siblings': 'off' } },
    // A service method takes a params type of its domain; a shared `SearchParams` and kit types also pass.
    'packages/contract/src/*/*.service.ts': {
      rules: { 'arch/effect-service-params': ['error', { name: ['^{Folder}\\w*Params$', '^SearchParams$'], allow: 'KitSchema\\.' }] },
    },
    // A page's props are `interface <Page>Props`, declared directly above the page.
    'packages/frontend/src/pages': { rules: { 'arch/react-props': 'error', 'arch/types-declarations': ['error', { allow: 'Props$' }] } },
    // A hook file exports the hook it is named after: `use-mobile.ts` exports `useMobile`.
    'packages/ui/src/hooks/use-*.ts': { rules: { 'arch/naming-exports': ['error', { mode: 'template', file: 'use-{name}.ts', export: 'use{Name}' }] } },
    'alchemy.*.ts': { rules: { 'import-extra/no-relative-packages': 'off' } },
  },
})
