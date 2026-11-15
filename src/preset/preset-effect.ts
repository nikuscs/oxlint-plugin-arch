import { existsSync, readdirSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { presetRecipes } from './preset-recipes.ts'
import { presetBaseImports, presetEffectImports, presetEffectServerImports, presetQueryWrites, presetTanstackRsc } from './preset.constants.ts'
import { PresetError, presetFilled, presetIsDirectory, presetIsFile, presetManifest, presetMerge, presetNames, presetSource } from './preset.utils.ts'
import type { FilesTopLevelOptions } from '../types/files.types.ts'
import type * as PresetTypes from '../types/preset.types.ts'

const presetEffectQueryWrites = Object.fromEntries(presetQueryWrites.map((name) => [name, 'A queries file only reads; write in an actions file.']))

const presetEffectWorkflowCalls = Object.fromEntries(
  ['selectFrom', ...presetQueryWrites].map((name) => [name, 'A workflow reaches data through its domain service, not the database.']),
)

const presetEffectFrameworks = Object.fromEntries(
  ['@tanstack/*', 'react-dom', 'react-dom/**', 'next', 'next/**', 'vite'].map((name) => [name, 'The server imports no web framework.']),
)

const presetEffectRouters = ['@tanstack/react-router', 'next/link', 'next/navigation', 'next/router', 'expo-router']

const presetEffectErrors = ['Schema.TaggedError', 'Schema.ErrorClass', 'Data.TaggedError', 'Data.Error']

const presetEffectContractKinds = ['*.schemas.ts', '*.admin.schemas.ts', '*.contract.ts', '*.admin.contract.ts', '*.errors.ts', '*.layer.types.ts', '*.service.ts']

const presetEffectSpans: PresetTypes.PresetRules[string] = [
  'error',
  { labels: [{ callee: 'Effect.fn', name: '{name}', drop: ['Action', 'Query'], loose: true }] },
]

const presetEffectSchemaUses = {
  namespaces: ['Schema'],
  methods: ['Array', 'Union', 'Record', 'Tuple'],
  structural: ['Struct', 'Array', 'Union', 'Record', 'Tuple', 'NullOr', 'UndefinedOr', 'optional', 'TaggedStruct'],
}

function presetEffectExists(root: string, key: string): (path: string) => boolean {
  return (path) => {
    const segments = path.split('/')
    const wildcard = segments.findIndex((segment) => segment.includes('*'))

    return existsSync(resolve(root, key, ...(wildcard === -1 ? segments : segments.slice(0, wildcard))))
  }
}

function presetEffectAt(root: string, key: string, value: PresetTypes.PresetFolder): (path: string) => string {
  const source = posix.relative(key, presetSource(root, key, value.source)) || '.'

  return (path) => (source === '.' ? path : posix.join(source, path))
}

function presetEffectCode(value: boolean | PresetTypes.PresetFolder): value is PresetTypes.PresetFolder {
  return value instanceof Object && Boolean(value.effect) && !(value.effect instanceof Object && value.effect.code === false)
}

function presetEffectContract(root: string, key: string, value: boolean | PresetTypes.PresetFolder): boolean {
  if (!presetEffectCode(value) || presetEffectDomains(root, key, value)) {
    return false
  }

  const source = resolve(root, presetSource(root, key, value.source))

  return presetIsDirectory(source) && readdirSync(source).some((name) => presetIsFile(resolve(source, name, `${name}.contract.ts`)))
}

function presetEffectDomains(root: string, key: string, value: boolean | PresetTypes.PresetFolder): boolean {
  return presetEffectCode(value) && presetIsDirectory(resolve(root, presetSource(root, key, value.source), 'domains'))
}

export function presetEffectServers(root: string, merged: PresetTypes.PresetFolders, units: PresetTypes.PresetEntry[]): void {
  for (const unit of units) {
    if (presetEffectDomains(root, unit[0], unit[1])) {
      unit[1] = presetMerge({ ...presetRecipes.backend, services: 'domains' }, unit[1])
      merged[unit[0]] = unit[1]
    }
  }
}

function presetEffectServerKeys(at: (path: string) => string): PresetTypes.PresetFolders {
  return {
    [at('.')]: {
      deny: { imports: { ...presetEffectFrameworks, 'effect/Config': 'Read config only in application/app.config.ts.' } },
      rules: {
        'arch/types-declarations': ['error', { modules: true }],
        'arch/types-inline': ['error', { variables: true, assertions: true, arguments: true }],
        'arch/comments-code': ['error', { why: false, jsdoc: true, allow: ['^\\s*SAFETY: '], steps: true }],
      },
    },
    [at('domains')]: {
      layout: {
        files: [
          '*.actions.ts',
          '*.queries.ts',
          '*.layer.ts',
          '*.workflows.ts',
          '*.prompts.ts',
          '*-*.driver.ts',
          '!*.service.ts',
          '!*.client.ts',
          '!*.server.ts',
          '!*.rsc.ts',
          '!*.rsc.tsx',
          '!*.utils.ts',
          '!*.types.ts',
          '!*.handler.ts',
          '!*-action.*.ts',
          '!*-query.*.ts',
        ],
      },
      deny: { imports: { '../*/*.constants{,.ts}': "Another domain's constants stay in that domain." } },
    },
    [at('domains/*/*.actions.ts')]: {
      limits: { lines: 1000 },
      rules: { 'arch/files-exports': ['error', { stem: 'folder', patterns: ['{domain}Action[A-Z]\\w*'], types: true }], 'arch/naming-labels': presetEffectSpans },
    },
    [at('domains/*/*.queries.ts')]: {
      limits: { lines: 1000 },
      deny: { calls: presetEffectQueryWrites, imports: { './*.actions{,.ts}': 'A queries file imports no actions.' } },
      rules: { 'arch/files-exports': ['error', { stem: 'folder', patterns: ['{domain}Query[A-Z]\\w*'], types: true }], 'arch/naming-labels': presetEffectSpans },
    },
    [at('domains/*/*.constants.ts')]: { rules: { 'arch/files-no-functions': ['error', { reexports: false }] } },
    [at('domains/*/*.layer.ts')]: { rules: { 'arch/effect-layer-file': ['error', { suffix: 'Layer' }] } },
    [at('domains/*/*.driver.ts')]: { rules: { 'arch/effect-layer-file': ['error', { suffix: 'Layer' }] } },
    [at('domains/*/*.workflows.ts')]: {
      rules: { 'arch/naming-labels': ['error', { labels: [{ callee: 'Workflow.make', name: '{name}', drop: 'Workflow$' }] }] },
      deny: {
        calls: presetEffectWorkflowCalls,
        imports: {
          '**/database': 'A workflow reaches data through its domain service, not the database.',
          './*.{actions,queries}{,.ts}': 'A workflow calls its domain service, not its own actions or queries.',
        },
      },
    },
    [at('application/app.config.ts')]: { deny: { imports: { 'effect/Config': false } } },
    [at('application/app.ts')]: {
      deny: { imports: { '**/domains/*/!(*.layer|*.layer.ts|*.workflows|*.workflows.ts)': 'The application imports only layer and workflows files.' } },
      rules: { 'arch/boundaries-imports': 'off' },
    },
    [at('**/*.tsx')]: { rules: { 'arch/files-restricted': ['error', { message: 'Mail templates in mails/ are the only JSX on a server.' }] } },
    [at('mails/*.mail.tsx')]: { rules: { 'arch/files-restricted': 'off' } },
    [at('rpc')]: { rules: { 'arch/code-delegate': 'error' } },
  }
}

function presetEffectContractKeys(at: (path: string) => string, files: unknown): PresetTypes.PresetFolders {
  const kinds = presetNames(presetEffectContractKinds, files ?? [], 'effect.files')

  if (kinds.some((kind) => !/^\*\.[a-z0-9.-]+\.ts$/.test(kind))) {
    throw new PresetError('effect.files takes contract file kinds such as `*.service.ts`.')
  }

  const pattern = `^[a-z0-9]+(?:-[a-z0-9]+)*(?:${kinds.map((kind) => kind.slice(1, -3).replaceAll('.', '[.]')).join('|')})[.]ts$`
  const listed = kinds.flatMap((kind) => (kind === '*.schemas.ts' ? ['<d>.schemas.ts', '<d>-<part>.schemas.ts'] : [`<d>${kind.slice(1)}`]))
  const message = `Contract files use ${listed.slice(0, -1).join(', ')} or ${listed.at(-1)}.`

  const schemas: PresetTypes.PresetFolder = {
    rules: {
      'arch/files-constants-only': ['error', { types: true, functions: true }],
      'arch/files-no-functions': ['error', { reexports: false }],
      'arch/types-imported-alias': 'error',
      'arch/schemas-single-use': ['error', presetEffectSchemaUses],
    },
  }

  const noFunctions: PresetTypes.PresetFolder = { rules: { 'arch/files-no-functions': 'error' } }

  return {
    [at('*/*.ts')]: {
      rules: {
        'arch/naming-file': ['error', { pattern, message }],
        'arch/naming-folder': ['error', { singularize: 'none', separators: ['.', '-'] }],
        'arch/files-exports': ['error', { stem: 'folder', singularize: 'trailing-s', patterns: ['{Domain}\\w*'] }],
      },
    },
    [at('*/*.admin.*.ts')]: { rules: { 'arch/files-exports': ['error', { stem: 'folder', singularize: 'trailing-s', patterns: ['Admin{Domain}\\w*'] }] } },
    [at('*/*.schemas.ts')]: schemas,
    [at('*/*.contract.ts')]: schemas,
    [at('*/*.errors.ts')]: noFunctions,
    [at('*/*.layer.types.ts')]: noFunctions,
    [at('*/*.service.ts')]: noFunctions,
    [at('shared/*.ts')]: {
      rules: {
        'arch/naming-file': 'off',
        'arch/naming-folder': 'off',
        'arch/files-exports': 'off',
        'arch/files-no-functions': 'off',
        'arch/files-constants-only': ['error', { types: true, functions: true }],
      },
    },
    [at('contract*.ts')]: {
      rules: {
        'arch/files-constants-only': ['error', { types: true, functions: true }],
        'arch/types-imported-alias': 'error',
        'arch/schemas-single-use': ['error', presetEffectSchemaUses],
      },
    },
  }
}

function presetEffectTop(allow: NonNullable<FilesTopLevelOptions['allow']>): PresetTypes.PresetFolder {
  return { top: { allow, stem: 'folder' } }
}

function presetEffectStrictServer(at: (path: string) => string, service: string | undefined): PresetTypes.PresetFolders {
  const operations = presetEffectTop([{ kind: 'const', exported: true, from: '^Effect\\.fn' }, { kind: 'const', names: '^decode[A-Z]' }])
  const layerKeys: PresetTypes.PresetRules = service === undefined ? {} : { 'arch/effect-layer-keys': ['error', { service }] }

  return {
    [at('.')]: {
      rules: {
        'arch/effect-yield-name': 'error',
        'arch/effect-yields-first': 'error',
        'arch/code-inside': ['error', { inside: [{ callee: '*.transaction', calls: { '*Workflow.execute': 'Start the workflow after the commit.' } }] }],
      },
    },
    [at('domains')]: { naming: { imports: { './{file}.ts': '{File}' } } },
    [at('domains/*/*.actions.ts')]: operations,
    [at('domains/*/*.queries.ts')]: operations,
    [at('domains/*/*.utils.ts')]: {
      ...operations,
      rules: { 'arch/naming-labels': ['error', { labels: [{ callee: 'Effect.fn', name: '{name}', loose: true }] }] },
    },
    [at('domains/*/*.layer.ts')]: {
      rules: { 'arch/naming-keys': ['error', { callees: ['*.bind'], name: '^{folder}(?:Action|Query){Path}$' }], ...layerKeys },
    },
    [at('domains/*/*.workflows.ts')]: {
      ...presetEffectTop([{ kind: 'const', from: '(?:^Workflow\\.make|\\.toLayer|^Layer\\.\\w+|^Schedule\\.\\w+)$' }]),
      rules: {
        'arch/files-exports': ['error', { stem: 'folder', patterns: ['{Domain}\\w*Workflow', '{Domain}WorkflowsLayer', '{domain}Schedule[A-Z]\\w*'] }],
      },
    },
    [at('domains/*/*.constants.ts')]: presetEffectTop([{ kind: 'const', exported: true, names: '^{DOMAIN}_' }]),
    [at('domains/*/*.config.ts')]: presetEffectTop([{ kind: 'const', exported: true, names: '^{domain}\\w*Config$' }]),
    [at('domains/*/*.prompts.ts')]: { rules: { 'arch/files-exports': ['error', { stem: 'folder', patterns: ['{domain}Prompt[A-Z]\\w*'], types: true }] } },
    [at('rpc/*/*.ts')]: {
      ...presetEffectTop([{ kind: 'const', exported: true }]),
      rules: {
        'arch/naming-file': ['error', { template: '{group}/rpc.{group}.{area}.ts', message: 'Handlers use rpc/<group>/rpc.<group>.<area>.ts.' }],
        'arch/files-exports': ['error', { file: 'rpc.{group}.{area}.ts', names: ['rpc{Group}{Area}'] }],
      },
    },
    [at('mails/*.mail.tsx')]: { rules: { 'arch/files-exports': ['error', { file: '{name}.mail.tsx', names: ['{name}Mail', '{Name}Email'], types: true }] } },
  }
}

function presetEffectStrictContract(at: (path: string) => string, name: string | undefined): PresetTypes.PresetFolders {
  const key = name === undefined ? [] : [{ callee: 'Context.Service', name: `${name}/{folder}/{file}/{name}` }]

  return {
    [at('*/*.schemas.ts')]: presetEffectTop(['type', 'interface', 'namespace', { kind: 'const', exported: true }]),
    [at('*/*.contract.ts')]: presetEffectTop(['type', { kind: 'const', exported: true }, { kind: 'const', exported: false, from: '^[A-Z]\\w*\\.' }]),
    [at('*/*.service.ts')]: {
      ...presetEffectTop(['interface', 'type', 'class', 'namespace']),
      rules: key.length > 0 ? { 'arch/naming-labels': ['error', { labels: key }] } : {},
    },
    [at('*/*.errors.ts')]: {
      ...presetEffectTop([{ kind: 'class', exported: true }]),
      rules: {
        'arch/naming-labels': [
          'error',
          {
            labels: [
              { callee: ['Schema.TaggedErrorClass', 'Schema.TaggedError', 'Data.TaggedError'], name: '{name}' },
              { callee: '*.Tagged', property: 'tag', name: '{name}' },
              { callee: '*.Tagged', property: 'code', pattern: '^[A-Z][A-Z0-9_]*$' },
            ],
          },
        ],
      },
    },
  }
}

const presetEffectStrictTests: PresetTypes.PresetFolder = { top: { allow: ['describe*', 'it*', 'test*', 'layer*'] } }

function presetEffectUnit(
  root: string,
  key: string,
  value: PresetTypes.PresetFolder,
  contract: PresetTypes.PresetEffectContract | undefined,
): PresetTypes.PresetFolders {
  if (!value.effect) {
    return {}
  }

  const at = presetEffectAt(root, key, value)

  const own = presetEffectContract(root, key, value)
  const server = presetEffectDomains(root, key, value)
  const options = value.effect instanceof Object ? value.effect : {}
  const service = contract && `${posix.join(root, contract.source)}/{folder}/{folder}.service.ts`
  const base = server ? presetEffectServerKeys(at) : presetEffectContractKeys(at, options.files)
  const tests = { 'tests/**/*.test.ts': presetEffectStrictTests, 'test/**/*.test.ts': presetEffectStrictTests }
  const strict = server ? { ...presetEffectStrictServer(at, service), ...tests } : presetEffectStrictContract(at, presetManifest(root, key).name)
  const locked = options.strict === false ? {} : strict
  const paths = [...new Set([...Object.keys(base), ...Object.keys(locked)])]
  const merged = (path: string) => (path in base && path in locked ? presetMerge(base[path], locked[path]) : (base[path] ?? locked[path]))
  const conventions = Object.fromEntries(paths.map((path) => [path, merged(path)]))
  const keys = server || own ? presetFilled(conventions, presetEffectExists(root, key)) : {}
  const errors = Object.fromEntries(presetEffectErrors.map((name) => [name, 'Tagged errors live in <d>.errors.ts.']))
  const placement: PresetTypes.PresetFolder = server || own ? { types: { placement: false } } : {}
  const imports = server || own ? { ...presetEffectImports, ...presetEffectServerImports } : presetEffectImports

  return {
    ...keys,
    '.': presetMerge({ ...placement, deny: { imports, calls: errors } }, keys['.'] ?? {}),
    [at('**/*.errors.ts')]: { deny: { calls: Object.fromEntries(presetEffectErrors.map((name) => [name, false])) } },
  }
}

function presetEffectFrontend(root: string, key: string, value: PresetTypes.PresetFolder): PresetTypes.PresetFolders {
  const at = presetEffectAt(root, key, value)
  const exists = presetEffectExists(root, key)
  const framework = [value.tanstack, value.next, value.expo].some(Boolean)

  if (!value.effect || !value.react || framework || !['pages', 'link.tsx', 'link.ts'].some((path) => exists(at(path)))) {
    return {}
  }

  const routers = presetEffectRouters.map((name) => ({ name, message: 'Import the router through link.tsx.' }))
  const linkRule: PresetTypes.PresetRules = { 'no-restricted-imports': ['error', { patterns: presetBaseImports }] }

  return presetFilled({
    '.': { forms: true },
    [at('.')]: {
      deny: { imports: { '@orpc/*': 'A frontend package takes its data functions as props, not from an rpc client.' } },
      rules: {
        'arch/react-query-props': 'error',
        'no-restricted-imports': [
          'error',
          { paths: [{ ...routers[0], allowImportNames: ['ClientOnly'] }, ...routers.slice(1)], patterns: presetBaseImports },
        ],
      },
    },
    [at('link.tsx')]: { rules: linkRule },
    [at('link.ts')]: { rules: linkRule },
    [at('services/**/*.client.ts')]: { rules: { 'arch/backend-service-functions': ['error', { frontend: true }] } },
  }, exists)
}

function presetEffectWeb(root: string, key: string, value: PresetTypes.PresetFolder, contracts: string[]): PresetTypes.PresetFolders {
  const at = presetEffectAt(root, key, value)

  if (contracts.length === 0 || !(value.tanstack || value.next)) {
    return {}
  }

  const types = contracts.map((name) => ({ name, allowTypeImports: true, message: 'The web imports the contract package as types only.' }))
  const rsc: PresetTypes.PresetFolder = { rules: { 'no-restricted-imports': ['error', { paths: types, patterns: presetBaseImports }] } }

  if (!value.tanstack) {
    return { [at('.')]: rsc }
  }

  const services = value.services ?? 'services'

  return {
    [at('.')]: { rules: { 'no-restricted-imports': ['error', { paths: [...types, presetTanstackRsc], patterns: presetBaseImports }] } },
    [at(`${services}/**/*.rsc.ts`)]: rsc,
    [at(`${services}/**/*.rsc.tsx`)]: rsc,
  }
}

function presetEffectKit(root: string, key: string, value: PresetTypes.PresetFolder, units: PresetTypes.PresetEntry[]): PresetTypes.PresetFolders {
  if (!value.kit || !value.effect) {
    return {}
  }

  const apps = units.filter(([other, folder]) => other !== key && !(folder instanceof Object && folder.kit))
  const names = apps.flatMap(([other]) => presetManifest(root, other).name ?? [])
  const message = 'A UI kit imports no app package.'

  return { '.': { deny: { imports: Object.fromEntries(names.flatMap((name) => [[name, message], [`${name}/**`, message]])) } } }
}

export function presetEffectConventions(
  root: string,
  key: string,
  value: PresetTypes.PresetFolder,
  units: PresetTypes.PresetEntry[],
): PresetTypes.PresetEntry[] {
  const packages = units.flatMap(([other, folder]): PresetTypes.PresetEffectContract[] => {
    const name = presetEffectContract(root, other, folder) ? presetManifest(root, other).name : undefined

    return name === undefined ? [] : [{ name, source: presetSource(root, other, folder instanceof Object ? folder.source : undefined) }]
  })

  const contracts = packages.map((item) => item.name)

  return [
    ...Object.entries(presetEffectUnit(root, key, value, packages.at(0))),
    ...Object.entries(presetEffectFrontend(root, key, value)),
    ...Object.entries(presetEffectWeb(root, key, value, contracts)),
    ...Object.entries(presetEffectKit(root, key, value, units)),
  ]
}
