import { existsSync, readdirSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { presetRecipes } from './preset-recipes.ts'
import { presetQueryWrites } from './preset.constants.ts'
import { presetFilled, presetIsDirectory, presetIsFile, presetMerge, presetSource } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'

const presetEffectQueryWrites = Object.fromEntries(presetQueryWrites.map((name) => [name, 'A queries file only reads; write in an actions file.']))

const presetEffectWorkflowCalls = Object.fromEntries(
  ['selectFrom', ...presetQueryWrites].map((name) => [name, 'A workflow reaches data through its domain service, not the database.']),
)

const presetEffectFrameworks = Object.fromEntries(
  ['@tanstack/*', 'react-dom', 'react-dom/**', 'next', 'next/**', 'vite'].map((name) => [name, 'The server imports no web framework.']),
)

const presetEffectErrors = ['Schema.TaggedError', 'Schema.ErrorClass', 'Data.TaggedError', 'Data.Error']

const presetEffectContractNames = '^[a-z0-9]+(?:-[a-z0-9]+)*(?:[.]schemas|[.]admin[.]schemas|[.]contract|[.]admin[.]contract|[.]errors|[.]layer[.]types)[.]ts$'

const presetEffectContractMessage =
  'Contract files use <d>.schemas.ts, <d>-<part>.schemas.ts, <d>.admin.schemas.ts, <d>.contract.ts, <d>.admin.contract.ts, <d>.errors.ts or <d>.layer.types.ts.'

const presetEffectSchemaUses = {
  namespaces: ['Schema'],
  methods: ['Array', 'Union', 'Record', 'Tuple'],
  structural: ['Struct', 'Array', 'Union', 'Record', 'Tuple', 'NullOr', 'UndefinedOr', 'optional', 'TaggedStruct'],
}

function presetEffectDomains(root: string, key: string, value: boolean | PresetTypes.PresetFolder): boolean {
  return value instanceof Object && Boolean(value.effect) && presetIsDirectory(resolve(root, presetSource(root, key, value.source), 'domains'))
}

export function presetEffectServers(root: string, merged: PresetTypes.PresetFolders, units: [string, boolean | PresetTypes.PresetFolder][]): void {
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
      rules: { 'arch/naming-exports': 'off' },
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
    [at('domains/*/*.layer.ts')]: { rules: { 'arch/effect-layer-file': 'error' } },
    [at('domains/*/*.driver.ts')]: { rules: { 'arch/effect-layer-file': 'error' } },
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
      deny: { imports: { '**/domains/*/*.{actions,queries,prompts,constants,driver}{,.ts}': 'The application imports only layer and workflows files.' } },
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
      'arch/files-constants-only': ['error', { types: true }],
      'arch/types-imported-alias': 'error',
      'arch/schemas-single-use': ['error', presetEffectSchemaUses],
    },
  }

  const shared: PresetTypes.PresetFolder = { rules: { 'arch/files-no-functions': 'error' } }

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
    [at('*/*.errors.ts')]: shared,
    [at('*/*.layer.types.ts')]: shared,
    [at('shared/*.ts')]: {
      rules: {
        'arch/naming-file': 'off',
        'arch/naming-folder': 'off',
        'arch/files-exports': 'off',
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

export function presetEffectConventions(root: string, key: string, value: PresetTypes.PresetFolder): PresetTypes.PresetFolders {
  if (!value.effect) {
    return {}
  }

  const source = posix.relative(key, presetSource(root, key, value.source)) || '.'
  const at = (path: string) => (source === '.' ? path : posix.join(source, path))

  const exists = (path: string) => {
    const segments = path.split('/')
    const wildcard = segments.findIndex((segment) => segment.includes('*'))

    return existsSync(resolve(root, key, ...(wildcard === -1 ? segments : segments.slice(0, wildcard))))
  }

  const contract = presetIsDirectory(resolve(root, key, source))
    && readdirSync(resolve(root, key, source)).some((name) => presetIsFile(resolve(root, key, source, name, `${name}.contract.ts`)))

  const server = presetEffectDomains(root, key, value)
  const contractKeys = contract ? presetEffectContractKeys(at) : {}
  const keys = presetFilled(server ? presetEffectServerKeys(at) : contractKeys, exists)
  const errors = Object.fromEntries(presetEffectErrors.map((name) => [name, 'Tagged errors live in <d>.errors.ts.']))
  const unit = keys['.'] ?? {}
  const placement: PresetTypes.PresetFolder = server || contract ? { types: { placement: false } } : {}

  return {
    ...keys,
    '.': unit instanceof Object ? presetMerge({ ...placement, deny: { calls: errors } }, unit) : unit,
    [at('**/*.errors.ts')]: { deny: { calls: Object.fromEntries(presetEffectErrors.map((name) => [name, false])) } },
  }
}
