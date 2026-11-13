import { existsSync, readdirSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { presetRecipes } from './preset-recipes.ts'
import { presetBaseImports, presetEffectImports, presetEffectServerImports, presetQueryWrites, presetTanstackRsc } from './preset.constants.ts'
import { presetFilled, presetIsDirectory, presetIsFile, presetManifest, presetMerge, presetSource } from './preset.utils.ts'
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

const presetEffectContractNames = '^[a-z0-9]+(?:-[a-z0-9]+)*(?:[.]schemas|[.]admin[.]schemas|[.]contract|[.]admin[.]contract|[.]errors|[.]layer[.]types)[.]ts$'

const presetEffectContractMessage =
  'Contract files use <d>.schemas.ts, <d>-<part>.schemas.ts, <d>.admin.schemas.ts, <d>.contract.ts, <d>.admin.contract.ts, <d>.errors.ts or <d>.layer.types.ts.'

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
      rules: { 'arch/files-exports': ['error', { stem: 'folder', patterns: ['{domain}Action[A-Z]\\w*'], types: true }] },
    },
    [at('domains/*/*.queries.ts')]: {
      limits: { lines: 1000 },
      deny: { calls: presetEffectQueryWrites, imports: { './*.actions{,.ts}': 'A queries file imports no actions.' } },
      rules: { 'arch/files-exports': ['error', { stem: 'folder', patterns: ['{domain}Query[A-Z]\\w*'], types: true }] },
    },
    [at('domains/*/*.constants.ts')]: { rules: { 'arch/files-no-functions': ['error', { reexports: false }] } },
    [at('domains/*/*.layer.ts')]: { rules: { 'arch/effect-layer-file': ['error', { suffix: 'Layer' }] } },
    [at('domains/*/*.driver.ts')]: { rules: { 'arch/effect-layer-file': ['error', { suffix: 'Layer' }] } },
    [at('domains/*/*.workflows.ts')]: {
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

function presetEffectContractKeys(at: (path: string) => string): PresetTypes.PresetFolders {
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
        'arch/naming-file': ['error', { pattern: presetEffectContractNames, message: presetEffectContractMessage }],
        'arch/naming-folder': ['error', { singularize: 'none', separators: ['.', '-'] }],
        'arch/files-exports': ['error', { stem: 'folder', singularize: 'trailing-s', patterns: ['{Domain}\\w*'] }],
      },
    },
    [at('*/*.admin.*.ts')]: { rules: { 'arch/files-exports': ['error', { stem: 'folder', singularize: 'trailing-s', patterns: ['Admin{Domain}\\w*'] }] } },
    [at('*/*.schemas.ts')]: schemas,
    [at('*/*.contract.ts')]: schemas,
    [at('*/*.errors.ts')]: noFunctions,
    [at('*/*.layer.types.ts')]: noFunctions,
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

function presetEffectUnit(root: string, key: string, value: PresetTypes.PresetFolder): PresetTypes.PresetFolders {
  if (!value.effect) {
    return {}
  }

  const at = presetEffectAt(root, key, value)

  const contract = presetEffectContract(root, key, value)
  const server = presetEffectDomains(root, key, value)
  const keys = server || contract ? presetFilled(server ? presetEffectServerKeys(at) : presetEffectContractKeys(at), presetEffectExists(root, key)) : {}
  const errors = Object.fromEntries(presetEffectErrors.map((name) => [name, 'Tagged errors live in <d>.errors.ts.']))
  const placement: PresetTypes.PresetFolder = server || contract ? { types: { placement: false } } : {}
  const imports = server || contract ? { ...presetEffectImports, ...presetEffectServerImports } : presetEffectImports

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
  const contracts = units.flatMap(([other, folder]) => (presetEffectContract(root, other, folder) ? (presetManifest(root, other).name ?? []) : []))

  return [
    ...Object.entries(presetEffectUnit(root, key, value)),
    ...Object.entries(presetEffectFrontend(root, key, value)),
    ...Object.entries(presetEffectWeb(root, key, value, contracts)),
    ...Object.entries(presetEffectKit(root, key, value, units)),
  ]
}
