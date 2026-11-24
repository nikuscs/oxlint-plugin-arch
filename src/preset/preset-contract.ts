import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { optionsEscape } from '../utils/options.utils.ts'
import { presetModuleErrorLabels } from './preset-module.ts'
import { PresetError, presetIsDirectory, presetNames, presetPlaces, presetTop } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'

const presetContractKinds = ['*.schemas.ts', '*.admin.schemas.ts', '*.contract.ts', '*.admin.contract.ts', '*.errors.ts', '*.layer.types.ts', '*.service.ts']

const presetContractTops = new Map<string, PresetTypes.PresetEffectTop>([
  ['*.schemas.ts', ['type', 'interface', 'namespace', { kind: 'const', exported: true }]],
  ['*.tables.ts', ['type', 'namespace']],
  ['*.contract.ts', ['type', { kind: 'const', exported: true }, { kind: 'const', exported: false, from: '^[A-Z]\\w*\\.' }]],
  ['*.service.ts', ['interface', 'type', 'class', 'namespace']],
  ['*.errors.ts', [{ kind: 'class', exported: true }]],
])

const presetContractRoot = ['contract.ts', 'contract.*.ts', 'errors.ts', 'index.ts']

export const presetContractAreas: PresetTypes.PresetEffectStrictArea[] = ['places', 'kinds', 'service', 'errors']

const presetContractSchemaUses = {
  namespaces: ['Schema'],
  methods: ['Array', 'Union', 'Record', 'Tuple'],
  structural: ['Struct', 'Array', 'Union', 'Record', 'Tuple', 'NullOr', 'UndefinedOr', 'optional', 'TaggedStruct'],
}

export function presetContractKindTops(options: PresetTypes.PresetEffectOptions, source?: string): Map<string, PresetTypes.PresetEffectTop | undefined> {
  const found = source !== undefined && presetIsDirectory(source)
    ? readdirSync(source).filter((name) => presetIsDirectory(resolve(source, name))).flatMap((name) => readdirSync(resolve(source, name)))
    : []

  const has = (kind: string) => found.some((name) => name.endsWith(kind.slice(1)))
  const tables = has('*.tables.ts')
  const layers = has('*.service.ts') && !has('*.layer.types.ts')
  const detected = ['*.tables.ts', '*.constants.ts'].filter(has)
  const defaults = [...presetContractKinds.filter((kind) => !layers || kind !== '*.layer.types.ts'), ...detected]
  const listed = presetNames(defaults, options.files ?? [], 'effect.files')
  const kinds = options.contract?.kinds ?? {}

  presetNames([], Object.keys(kinds), 'effect.contract.kinds')

  const names = [...new Set([...listed, ...Object.keys(kinds)])].filter((kind) => kinds[kind] !== false)

  if (names.some((kind) => !/^\*\.[a-z0-9.-]+\.ts$/.test(kind))) {
    throw new PresetError('effect.files takes contract file kinds such as `*.service.ts`.')
  }

  const top = (kind: string) => (tables && kind === '*.service.ts' ? [{ kind: 'class' as const, exported: true }] : presetContractTops.get(kind))

  return new Map(names.map((kind) => [kind, Array.isArray(kinds[kind]) ? kinds[kind] : top(kind)]))
}

export function presetContractKeys(at: (path: string) => string, kinds: string[]): PresetTypes.PresetFolders {
  const pattern = `^[a-z0-9]+(?:-[a-z0-9]+)*(?:${kinds.map((kind) => kind.slice(1, -3).replaceAll('.', '[.]')).join('|')})[.]ts$`
  const listed = kinds.flatMap((kind) => (kind === '*.schemas.ts' ? ['<d>.schemas.ts', '<d>-<part>.schemas.ts'] : [`<d>${kind.slice(1)}`]))
  const message = `Contract files use ${listed.slice(0, -1).join(', ')} or ${listed.at(-1)}.`

  const schemas: PresetTypes.PresetFolder = {
    rules: {
      'arch/files-constants-only': ['error', { types: true, functions: true }],
      'arch/files-no-functions': ['error', { reexports: false }],
      'arch/types-imported-alias': 'error',
      'arch/schemas-single-use': ['error', presetContractSchemaUses],
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
    [at('*/*.schemas.ts')]: { rules: { ...schemas.rules, 'arch/effect-schema-first': 'error' } },
    [at('*/*.contract.ts')]: schemas,
    [at('*/*.errors.ts')]: noFunctions,
    [at('*/*.layer.types.ts')]: noFunctions,
    [at('*/*.service.ts')]: { rules: { 'arch/files-no-functions': 'error', 'effecttsgo/lazy-effect': 'off' } },
    [at('*/*.constants.ts')]: { rules: { 'arch/files-exports': ['error', { patterns: ['{STEM}(?:_[A-Z0-9]+)*'] }] } },
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
        'arch/schemas-single-use': ['error', presetContractSchemaUses],
      },
    },
    [at('contract.constants.ts')]: { rules: { 'arch/files-constants-only': ['error', { reexports: true }] } },
  }
}

export function presetContractStrict(
  at: (path: string) => string,
  name: string | undefined,
  kinds: Map<string, PresetTypes.PresetEffectTop | undefined>,
  options: PresetTypes.PresetEffectOptions,
): PresetTypes.PresetEffectStrictEntry[] {
  const template = options.contract?.service
  const key = name === undefined || template === false ? [] : [{ callee: 'Context.Service', name: (template ?? '{package}/{folder}/{file}/{name}').replaceAll('{package}', name) }]
  const labels: PresetTypes.PresetRules = key.length > 0 ? { 'arch/naming-labels': ['error', { labels: key }] } : {}
  const root = presetNames(presetContractRoot, options.contract?.root ?? [], 'effect.contract.root')
  const pattern = `^(?:${root.map((file) => optionsEscape(file).replaceAll('\\*', '[a-z0-9-]+')).join('|')})$`
  const errors = options.errors?.files === undefined

  const sibling: PresetTypes.PresetRules = kinds.has('*.service.ts')
    ? { 'arch/files-siblings': ['error', { require: '{folder}.service.ts', message: 'A domain is reached through its service.' }] }
    : {}

  const tops = [...kinds].flatMap(([kind, top]): PresetTypes.PresetEffectStrictEntry[] => (top === undefined || (kind === '*.errors.ts' && !errors) ? [] : [['kinds', at(`*/${kind}`), presetTop(top)]]))

  const schemasTop = kinds.get('*.schemas.ts')
  const shared: PresetTypes.PresetEffectStrictEntry[] = schemasTop ? [['kinds', at('shared/*.schemas.ts'), presetTop([...schemasTop, { kind: 'function-const', exported: true }])]] : []

  const entries: PresetTypes.PresetEffectStrictEntry[] = [
    ['places', at('*.ts'), { rules: { 'arch/naming-file': ['error', { pattern, message: `A file beside the contract folders is ${presetPlaces(root)}.` }] } }],
    ['places', at('*/*/**/*.ts'), { rules: { 'arch/files-restricted': ['error', { message: 'A contract folder is flat: no folder below <d>/.' }] } }],
    ...tops,
    ...shared,
    ['kinds', at('*/*.contract.ts'), { deny: { calls: { 'Schema.Struct': 'Name the Schema in <d>.schemas.ts.' } }, rules: sibling }],
    ['service', at('*/*.service.ts'), { rules: { ...labels, 'arch/effect-service-params': ['error', { allow: ['^\\w+Schemas\\.'] }] } }],
  ]

  if (errors) {
    const tag = { callee: ['Schema.TaggedErrorClass', 'Schema.TaggedError', 'Data.TaggedError'], name: options.errors?.tag ?? '{name}' }

    entries.push(['errors', at('*/*.errors.ts'), { rules: { 'arch/naming-labels': ['error', { labels: [tag, ...presetModuleErrorLabels(options.errors, '*.Tagged')] }] } }])
  }

  return entries
}
