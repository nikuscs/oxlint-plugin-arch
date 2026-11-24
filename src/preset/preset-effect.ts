import { existsSync, readdirSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { presetContractAreas, presetContractKeys, presetContractKindTops, presetContractStrict } from './preset-contract.ts'
import { presetModuleConventions, presetModuleErrors, presetModuleYields } from './preset-module.ts'
import { presetRecipes } from './preset-recipes.ts'
import { presetBaseImports, presetEffectImports, presetEffectServerImports, presetQueryWrites, presetTanstackRsc } from './preset.constants.ts'
import { PresetError, presetFilled, presetIsDirectory, presetIsFile, presetManifest, presetMerge, presetNames, presetPlaces, presetSource, presetTop } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'

const presetEffectQueryWrites = Object.fromEntries(presetQueryWrites.map((name) => [name, 'A queries file only reads; write in an actions file.']))

const presetEffectWorkflowCalls = Object.fromEntries(
  ['selectFrom', ...presetQueryWrites].map((name) => [name, 'A workflow reaches data through its domain service, not the database.']),
)

const presetEffectFrameworks = Object.fromEntries(['@tanstack/*', 'react-dom', 'react-dom/**', 'next', 'next/**', 'vite'].map((name) => [name, 'The server imports no web framework.']))

const presetEffectRouters = ['@tanstack/react-router', 'next/link', 'next/navigation', 'next/router', 'expo-router']

const presetEffectServerFolders = ['application', 'domains', 'rpc', 'mails']

const presetEffectDomainKinds = [
  '*.actions.ts', '*.queries.ts', '*.layer.ts', '*.workflows.ts', '*.prompts.ts', '*-*.driver.ts', '*.config.ts', '*.utils.ts', '!*.service.ts', '!*.client.ts',
  '!*.server.ts', '!*.rsc.ts', '!*.rsc.tsx', '!*.types.ts', '!*.handler.ts', '!*-action.*.ts', '!*-query.*.ts',
]

const presetEffectTests = ['tests/**/*.test.ts', 'test/**/*.test.ts', 'tests/**/*.spec.ts', 'test/**/*.spec.ts']

const presetEffectErrors = ['Schema.TaggedError', 'Schema.ErrorClass', 'Data.TaggedError', 'Data.Error']

const presetEffectWorkflowLabels = [
  { callee: 'Workflow.make', name: '{name}', drop: 'Workflow$' },
  { callee: 'Activity.make', property: 'name', pattern: '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$' },
]

const presetEffectServerAreas: PresetTypes.PresetEffectStrictArea[] = ['code', 'places', 'domains', 'rpc', 'mails', 'tests']

function presetEffectServerSettings(server: PresetTypes.PresetEffectServer = {}): PresetTypes.PresetEffectServerSettings {
  const kinds = server.kinds ?? []
  const flip = (name: string) => (name.startsWith('!') ? name.slice(1) : `!${name}`)

  presetNames([], kinds, 'effect.server.kinds')

  return {
    folders: presetNames(presetEffectServerFolders, server.folders ?? [], 'effect.server.folders'),
    kinds: [...presetEffectDomainKinds.filter((name) => !kinds.includes(name) && !kinds.includes(flip(name))), ...kinds],
    actions: server.operations?.actions ?? 'Action',
    queries: server.operations?.queries ?? 'Query',
    spans: server.spans !== false,
    rpc: { file: server.rpc?.file ?? '{group}/rpc.{group}.{area}.ts', names: server.rpc?.names ?? ['rpc{Group}{Area}'] },
    tests: server.tests === false ? [] : presetNames(presetEffectTests, server.tests ?? [], 'effect.server.tests', /^!?\S+$/),
  }
}

function presetEffectStrict(strict: PresetTypes.PresetEffectOptions['strict'], areas: PresetTypes.PresetEffectStrictArea[]): PresetTypes.PresetEffectStrictArea[] {
  if (strict === undefined || typeof strict === 'boolean') {
    return strict === false ? [] : areas
  }

  const known = [...new Set([...presetEffectServerAreas, ...presetContractAreas])]
  const unknown = Object.keys(strict).find((area) => !known.some((name) => name === area))

  if (unknown !== undefined) {
    throw new PresetError(`Unknown effect.strict area \`${unknown}\`; use ${known.join(', ')}.`)
  }

  return areas.filter((area) => strict[area] !== false)
}

function presetEffectAreas(entries: PresetTypes.PresetEffectStrictEntry[], areas: PresetTypes.PresetEffectStrictArea[]): PresetTypes.PresetFolders {
  const folders: PresetTypes.PresetFolders = {}

  for (const [area, path, folder] of entries) {
    if (areas.includes(area)) {
      folders[path] = path in folders ? presetMerge(folders[path], folder) : folder
    }
  }

  return folders
}

function presetEffectExtraFolders(source: string, folders: string[]): string[] {
  return presetIsDirectory(source) ? readdirSync(source).filter((name) => !folders.includes(name) && presetIsDirectory(resolve(source, name))) : []
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

function presetEffectServerKeys(at: (path: string) => string, settings: PresetTypes.PresetEffectServerSettings): PresetTypes.PresetFolders {
  const label = { callee: 'Effect.fn', name: '{name}', drop: [settings.actions, settings.queries], loose: true }
  const spans: PresetTypes.PresetRules = settings.spans ? { 'arch/naming-labels': ['error', { labels: [label] }] } : {}

  return {
    [at('.')]: {
      deny: { imports: { ...presetEffectFrameworks, 'effect/Config': 'Read config only in application/app.config.ts or domains/<d>/<d>.config.ts.' } },
      rules: {
        'arch/types-declarations': ['error', { modules: true }],
        'arch/types-inline': ['error', { variables: true, assertions: true, arguments: true }],
        'arch/comments-code': ['error', { why: false, jsdoc: true, allow: ['^\\s*SAFETY: '], steps: true }],
      },
    },
    [at('domains')]: {
      layout: { files: settings.kinds },
      deny: { imports: { '../*/*.constants{,.ts}': "Another domain's constants stay in that domain." } },
    },
    [at('domains/*/*.actions.ts')]: {
      rules: { 'arch/files-exports': ['error', { stem: 'folder', patterns: [`{domain}${settings.actions}[A-Z]\\w*`], types: true }], ...spans },
    },
    [at('domains/*/*.queries.ts')]: {
      deny: { calls: presetEffectQueryWrites, imports: { './*.actions{,.ts}': 'A queries file imports no actions.' } },
      rules: { 'arch/files-exports': ['error', { stem: 'folder', patterns: [`{domain}${settings.queries}[A-Z]\\w*`], types: true }], ...spans },
    },
    [at('domains/*/*.constants.ts')]: { rules: { 'arch/files-no-functions': ['error', { reexports: false }] } },
    [at('domains/*/*.layer.ts')]: { rules: { 'arch/effect-layer-file': ['error', { suffix: 'Layer' }] } },
    [at('domains/*/*.driver.ts')]: { rules: { 'arch/effect-layer-file': ['error', { suffix: 'Layer' }] } },
    [at('domains/*/*.workflows.ts')]: {
      rules: { 'arch/naming-labels': ['error', { labels: presetEffectWorkflowLabels }] },
      deny: {
        calls: presetEffectWorkflowCalls,
        imports: {
          '**/database': 'A workflow reaches data through its domain service, not the database.',
          './*.{actions,queries}{,.ts}': 'A workflow calls its domain service, not its own actions or queries.',
        },
      },
    },
    [at('application/app.config.ts')]: { deny: { imports: { 'effect/Config': false } } },
    [at('domains/*/*.config.ts')]: { deny: { imports: { 'effect/Config': false } } },
    [at('application/app.ts')]: {
      deny: { imports: { '**/domains/*/!(*.layer|*.layer.ts|*.workflows|*.workflows.ts)': 'The application imports only layer and workflows files.' } },
      rules: { 'arch/boundaries-imports': 'off' },
    },
    [at('**/*.tsx')]: { rules: { 'arch/files-restricted': ['error', { message: 'Mail templates in mails/ are the only JSX on a server.' }] } },
    [at('mails/*.mail.tsx')]: { rules: { 'arch/files-restricted': 'off' } },
    [at('mails/*.mail.ts')]: { rules: { 'linteffect/prevent-dynamic-imports': 'off' } },
    [at('rpc')]: { rules: { 'arch/code-delegate': 'error' } },
  }
}

function presetEffectStrictServer(
  at: (path: string) => string,
  service: string | undefined,
  extra: string[],
  settings: PresetTypes.PresetEffectServerSettings,
  options: PresetTypes.PresetEffectOptions,
): PresetTypes.PresetEffectStrictEntry[] {
  const operations = presetTop([{ kind: 'const', exported: true, from: '^Effect\\.fn' }, { kind: 'const', names: '^decode[A-Z]', uses: 2 }])
  const layerKeys: PresetTypes.PresetRules = service === undefined ? {} : { 'arch/effect-layer-keys': ['error', { service }] }
  const places: PresetTypes.PresetFolder = { rules: { 'arch/files-restricted': ['error', { message: `Server code lives in ${presetPlaces(settings.folders.map((name) => `${name}/`))}.` }] } }
  const handlers = options.handlers?.allow === undefined ? {} : { allow: options.handlers.allow }

  const testFolders = [...new Set(settings.tests.map((glob) => glob.split('/')[0]).filter((folder) => Boolean(folder) && !folder.includes('*')))]
  const testRules: PresetTypes.PresetFolder = { rules: { 'arch/code-function-nesting': ['error', { max: 5 }], 'arch/effect-yield-name': 'off' } }
  const strictTests: PresetTypes.PresetFolder = { top: { allow: ['describe*', 'it*', 'test*', 'layer*'] } }

  return [
    [
      'code',
      at('.'),
      {
        rules: {
          'arch/effect-yield-name': presetModuleYields(options.yields),
          'arch/effect-yields-first': 'error',
          'arch/code-inside': ['error', { inside: [{ callee: '*.transaction', calls: { '*Workflow.execute': 'Start the workflow after the commit.' } }] }],
        },
      },
    ],
    ['places', at('*.ts'), places],
    ...extra.map((name): PresetTypes.PresetEffectStrictEntry => ['places', at(name), places]),
    ['rpc', at('rpc/*.ts'), { rules: { 'arch/naming-file': ['error', { pattern: '^rpc[.][a-z0-9-]+[.]ts$', message: 'A file in rpc/ is rpc.<name>.ts.' }] } }],
    ['places', at('rpc/*/*/**/*.ts'), { rules: { 'arch/files-restricted': ['error', { message: 'Handlers sit in rpc/<group>/, with no folder below it.' }] } }],
    ['domains', at('domains'), { naming: { imports: { './{file}.ts': '{File}' } } }],
    ['domains', at('domains/*/*.actions.ts'), operations],
    ['domains', at('domains/*/*.queries.ts'), operations],
    ['domains', at('domains/*/*.utils.ts'), { ...operations, rules: { 'arch/naming-labels': ['error', { labels: [{ callee: 'Effect.fn', name: '{name}', loose: true }] }] } }],
    [
      'domains',
      at('domains/*/*.layer.ts'),
      { rules: { 'arch/naming-keys': ['error', { callees: ['*.bind', '*.of'], name: `^{folder}(?:${settings.actions}|${settings.queries}){Path}$`, inline: false }], ...layerKeys } },
    ],
    [
      'domains',
      at('domains/*/*.workflows.ts'),
      {
        ...presetTop([{ kind: 'const', from: '(?:^Workflow\\.make|\\.toLayer|^Layer\\.\\w+|^Schedule\\.\\w+)$' }]),
        rules: {
          'arch/files-exports': ['error', { stem: 'folder', patterns: ['{Domain}\\w*Workflow', '{Domain}WorkflowsLayer', '{domain}Schedule[A-Z]\\w*'] }],
          'arch/naming-labels': ['error', { labels: [...presetEffectWorkflowLabels, { callee: 'Effect.fn', name: '{name}', within: '*.toLayer', loose: true }] }],
        },
      },
    ],
    ['domains', at('domains/*/*.constants.ts'), presetTop([{ kind: 'const', exported: true, names: '^{DOMAIN}_' }])],
    ['domains', at('domains/*/*.config.ts'), presetTop([{ kind: 'const', exported: true, names: '^{domain}\\w*Config$' }])],
    [
      'domains',
      at('domains/*/*.prompts.ts'),
      { ...presetTop([{ kind: 'const', exported: true }]), rules: { 'arch/files-exports': ['error', { stem: 'folder', patterns: ['{domain}Prompt[A-Z]\\w*'], types: true }] } },
    ],
    [
      'rpc',
      at('rpc/*/*.ts'),
      {
        ...presetTop([{ kind: 'const', exported: true }]),
        rules: {
          'arch/naming-file': ['error', { template: settings.rpc.file, message: `Handlers use rpc/${presetPlaces([settings.rpc.file])}.` }],
          'arch/files-exports': ['error', { file: posix.basename(settings.rpc.file), names: settings.rpc.names }],
          'arch/naming-keys': ['error', { exports: '^rpc[A-Z]', delegate: true, ...handlers }],
        },
      },
    ],
    ['mails', at('mails/*.mail.tsx'), { rules: { 'arch/files-exports': ['error', { file: '{name}.mail.tsx', names: ['{name}Mail', '{Name}Email'], types: true }] } }],
    ...testFolders.map((folder): PresetTypes.PresetEffectStrictEntry => ['tests', folder, testRules]),
    ...settings.tests.map((glob): PresetTypes.PresetEffectStrictEntry => ['tests', glob, strictTests]),
  ]
}

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
  const settings = presetEffectServerSettings(options.server)
  const kinds = presetContractKindTops(options, server ? undefined : resolve(root, key, at('.')))
  const base = server ? presetEffectServerKeys(at, settings) : presetContractKeys(at, [...kinds.keys()])

  const extra = presetEffectExtraFolders(resolve(root, key, at('.')), settings.folders)

  const locked = server
    ? presetEffectAreas(presetEffectStrictServer(at, service, extra, settings, options), presetEffectStrict(options.strict, presetEffectServerAreas))
    : presetEffectAreas(presetContractStrict(at, presetManifest(root, key).name, kinds, options), presetEffectStrict(options.strict, presetContractAreas))

  const paths = [...new Set([...Object.keys(base), ...Object.keys(locked)])]
  const merged = (path: string) => (path in base && path in locked ? presetMerge(base[path], locked[path]) : (base[path] ?? locked[path]))
  const conventions = Object.fromEntries(paths.map((path) => [path, merged(path)]))
  const keys = server || own ? presetFilled(conventions, presetEffectExists(root, key)) : {}
  const constructors = presetNames(presetEffectErrors, options.errors?.constructors ?? [], 'effect.errors.constructors')
  const errors = Object.fromEntries(constructors.map((name) => [name, options.errors?.message ?? 'Tagged errors live in <d>.errors.ts.']))
  const placement: PresetTypes.PresetFolder = server || own ? { types: { placement: false } } : {}
  const imports = server || own ? { ...presetEffectImports, ...presetEffectServerImports } : presetEffectImports
  const owned = options.errors?.files !== undefined

  return {
    ...keys,
    '.': presetMerge({ ...placement, deny: { imports, calls: errors } }, keys['.'] ?? {}),
    ...presetFilled(presetModuleErrors(options.errors, at('**/*.errors.ts'), constructors), owned ? presetEffectExists(root, key) : () => true),
  }
}

function presetEffectLabels(
  entries: PresetTypes.PresetEntry[],
  labels: PresetTypes.PresetEffectOptions['labels'],
  at: (path: string) => string,
  exists: (path: string) => boolean,
): PresetTypes.PresetEntry[] {
  if (labels === undefined) {
    return entries
  }

  if (!(labels instanceof Object) || !Object.values(labels).every(Array.isArray)) {
    throw new PresetError('effect.labels maps a file pattern to a list of naming-labels entries.')
  }

  const result = [...entries]

  for (const [glob, extra] of Object.entries(labels)) {
    const path = at(glob)
    const index = result.findLastIndex(([key]) => key === path)
    const folder = index === -1 ? {} : result[index][1]
    const rules = folder instanceof Object ? (folder.rules ?? {}) : {}
    const current = rules['arch/naming-labels']
    const stored: unknown = Array.isArray(current) ? current[1] : undefined
    const listed: unknown[] = stored instanceof Object && 'labels' in stored && Array.isArray(stored.labels) ? stored.labels : []
    const updated: PresetTypes.PresetFolder = { ...Object(folder), rules: { ...rules, 'arch/naming-labels': ['error', { ...Object(stored), labels: [...listed, ...extra] }] } }

    if (index !== -1) {
      result[index] = [path, updated]
    } else if (exists(path)) {
      result.push([path, updated])
    }
  }

  return result
}

function presetEffectViews(at: (path: string) => string): PresetTypes.PresetFolders {
  const names: PresetTypes.PresetRules = { 'arch/naming-declarations': ['error', { kinds: ['interface'] }, { kinds: ['type', 'interface'], pattern: 'Props$' }] }
  const props: PresetTypes.PresetRules = { 'arch/types-declarations': ['error', { allow: 'Props$' }] }
  const context = 'reads React state through use(), not useContext().'
  const storage = ['localStorage', 'sessionStorage'].flatMap((store) => ['getItem', 'setItem'].map((method) => [`${store}.${method}`, `Read ${store} through a hook.`]))
  const builders = ['Struct', 'Literals', 'Union', 'Array', 'Record'].map((name) => [`Schema.${name}`, 'Define a Schema in constants/ or the contract, not in a view.'])

  const calls = (owner: string): PresetTypes.PresetFolder => ({
    deny: { calls: { useContext: `${owner} ${context}`, ...Object.fromEntries(storage), ...Object.fromEntries(builders) } },
    rules: { 'arch/naming-folder': ['error', { singularize: 'none', separators: ['-'] }] },
  })

  const impure = Object.fromEntries(['DateTime.now', 'DateTime.nowUnsafe', 'Date.now', 'Math.random'].map((name) => [name, 'Take `now` or `random` from the caller so a client function stays pure.']))

  return {
    [at('components')]: calls('A component'),
    [at('components/**/*.tsx')]: {
      rules: {
        'arch/files-exports': ['error', { file: '{area}/{name}.tsx', names: ['{Name}'], types: true }],
        'arch/files-top-level': [
          'error',
          { file: '{area}/{name}.tsx', allow: ['import', 'interface', { kind: 'function', names: '^{Name}' }, { kind: 'const', exported: true, names: '^{Name}$', from: '^lazy$' }] },
        ],
        ...names,
      },
    },
    [at('pages')]: calls('A page'),
    [at('pages/**/*.ts')]: { rules: { 'arch/files-restricted': ['error', { message: 'Pages use TSX.' }] } },
    [at('pages/**/*.tsx')]: {
      rules: {
        'arch/react-props': ['error', { prefix: true }],
        'arch/files-components-only': ['error', { filename: true, types: true }],
        'arch/files-helpers': ['error', { components: true, hooks: '^use[A-Z]' }],
        'arch/files-exports': ['error', { file: '{area}/{name}-page.tsx', names: ['{Name}Page'], types: true }],
        'arch/files-top-level': ['error', { allow: ['import', 'interface', { kind: 'function', names: '^{Stem}' }] }],
        ...props,
        ...names,
      },
    },
    [at('context/*.ts')]: { deny: { calls: { useContext: `A context file ${context}` } }, rules: { 'arch/files-exports': ['error', { patterns: ['[A-Z]\\w*Context$'], types: true }] } },
    [at('context/**/*.tsx')]: { rules: props },
    [at('constants/*.constants.ts')]: {
      limits: { lines: 400 },
      rules: { 'arch/files-exports': ['error', { patterns: ['{STEM}(?!_{STEM}_)(?:_[A-Z0-9]+)*', '{Stem}(?!{Stem}[A-Z])[A-Z]\\w*'], types: true }] },
    },
    [at('services/*.client.ts')]: { deny: { calls: impure }, rules: { 'arch/files-exports': ['error', { patterns: ['{stem}(?!Client)(?:[A-Z]\\w*)?'], types: true }] } },
    [at('types/*.types.ts')]: { rules: { 'arch/files-exports': ['error', { patterns: ['{Stem}(?!Client[A-Z])[A-Z]\\w*'] }] } },
  }
}

const presetEffectParsers = {
  'JSON.stringify': 'Encode with a Schema, not JSON.stringify.',
  parseInt: 'Parse with Number.parse or a Schema.',
  parseFloat: 'Parse with Number.parse or a Schema.',
}

function presetEffectFrontend(root: string, key: string, value: PresetTypes.PresetFolder, contracts: string[]): PresetTypes.PresetFolders {
  const at = presetEffectAt(root, key, value)
  const exists = presetEffectExists(root, key)
  const framework = [value.tanstack, value.next, value.expo].some(Boolean)

  if (!value.effect || !value.react || framework || !['pages', 'link.tsx', 'link.ts'].some((path) => exists(at(path)))) {
    return {}
  }

  const routers = presetEffectRouters.map((name) => ({ name, message: 'Import the router through link.tsx.' }))
  const linkRule: PresetTypes.PresetRules = { 'no-restricted-imports': ['error', { patterns: presetBaseImports }] }
  const services = Object.fromEntries(contracts.map((name) => [`${name}/*/*.service{,.ts}`, 'A frontend package takes its data functions as props, not from a contract service.']))

  return presetFilled({
    '.': contracts.length > 0 ? { forms: true, deny: { imports: services } } : { forms: true },
    [at('.')]: {
      deny: { calls: presetEffectParsers, imports: { '@orpc/*': 'A frontend package takes its data functions as props, not from an rpc client.' } },
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
    ...presetEffectViews(at),
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
    return { [at('.')]: { ...rsc, deny: { calls: presetEffectParsers } } }
  }

  const services = value.services ?? 'services'

  return {
    [at('.')]: { deny: { calls: presetEffectParsers }, rules: { 'no-restricted-imports': ['error', { paths: [...types, presetTanstackRsc], patterns: presetBaseImports }] } },
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

  const own: PresetTypes.PresetEntry[] = [
    ...Object.entries(presetEffectUnit(root, key, value, packages.at(0))),
    ...Object.entries(presetFilled(presetModuleConventions(root, key, value), presetEffectExists(root, key))),
  ]

  const labels = value.effect instanceof Object ? value.effect.labels : undefined

  return [
    ...presetEffectLabels(own, labels, presetEffectAt(root, key, value), presetEffectExists(root, key)),
    ...Object.entries(presetEffectFrontend(root, key, value, contracts)),
    ...Object.entries(presetEffectWeb(root, key, value, contracts)),
    ...Object.entries(presetEffectKit(root, key, value, units)),
  ]
}
