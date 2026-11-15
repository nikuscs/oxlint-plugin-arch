import { posix } from 'node:path'
import { namingCamelCase, namingPascalCase, namingTemplatePattern } from '../utils/naming.utils.ts'
import { optionsEscape } from '../utils/options.utils.ts'
import { presetManifest, presetMerge, presetNames, presetSource } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'

const presetModuleKinds = [
  '*.types.ts', '*.config.ts', '*.constants.ts', '*.migrations.ts', '*.layer.ts', '*.fake.ts', '*.testing.ts', '*.utils.ts', '*.handlers.ts',
  '*.middlewares.ts', '*.translations-*.ts', '*.assets.d.ts',
]

const presetModuleParts = ['*.types.ts', '*.layer.ts', '*.driver.ts', '*.fake.ts', '*.testing.ts', '*.adapter.ts', '*.index.ts']

const presetModuleTested = ['layer', 'fake', 'adapter', 'utils', 'handlers', 'middlewares', 'testing', 'driver']

const presetModuleSupport = ['layer', 'cases', 'scenarios']

const presetModuleTests = ['test', 'bench', 'suite']

const presetModuleDefaults = { folder: 'test', support: 'support', factories: 'testing/{module}.factories.ts' }

const presetModuleLayerCalls = [
  'Layer.effect', 'Layer.effectContext', 'Layer.effectDiscard', 'Layer.succeed', 'Layer.succeedContext', 'Layer.sync', 'Layer.unwrap', 'Layer.merge',
  'Layer.mergeAll', 'Layer.provide', 'Layer.provideMerge', 'Layer.fresh', 'Layer.orDie', 'Layer.catch', 'Layer.scoped', 'Layer.scopedDiscard',
  'Layer.discard',
]

const presetModuleSchemaReads = [
  'asserts', 'is', 'isSchema', 'isSchemaError', 'resolveAnnotations', 'decode', 'decodeEffect', 'decodeExit', 'decodeOption', 'decodePromise',
  'decodeResult', 'decodeSync', 'decodeUnknownEffect', 'decodeUnknownExit', 'decodeUnknownOption', 'decodeUnknownPromise', 'decodeUnknownResult',
  'decodeUnknownSync', 'encode', 'encodeEffect', 'encodeExit', 'encodeOption', 'encodePromise', 'encodeResult', 'encodeSync', 'encodeUnknownEffect',
  'encodeUnknownExit', 'encodeUnknownOption', 'encodeUnknownPromise', 'encodeUnknownResult', 'encodeUnknownSync',
]

const presetModuleDocblockFree: PresetTypes.PresetRules[string] = ['error', { why: false, jsdoc: false, allow: ['^\\s*SAFETY: '] }]

const presetModuleLayerMessage = 'Build layers in a .layer.ts, .driver.ts or .fake.ts file.'

const presetModuleMethod = '[a-z][A-Za-z0-9]*(?:\\.[a-z][A-Za-z0-9]*)*'

function presetModuleKind(name: string): string {
  return name.slice(2, -3)
}

function presetModuleSpans(spans: string | false | undefined, name: string): PresetTypes.PresetRules {
  if (spans === false) {
    return {}
  }

  const pattern = optionsEscape(spans ?? '{module}.{method}').replaceAll('\\{module\\}', name).replaceAll('\\{method\\}', presetModuleMethod)

  return { 'arch/naming-labels': ['error', { labels: [{ callee: 'Effect.fn', pattern: `^${pattern}$` }] }] }
}

function presetModuleSource(at: (path: string) => string, flat: boolean, spans: PresetTypes.PresetRules): PresetTypes.PresetFolders {
  const rules: PresetTypes.PresetRules = {
    ...spans,
    'arch/effect-yield-name': 'error',
    'arch/effect-yields-first': 'error',
    'arch/types-inline': ['error', { min: 2 }],
    'eslint/no-shadow': 'off',
    'linteffect/prevent-dynamic-imports': 'off',
  }

  if (!flat) {
    rules['arch/types-declarations'] = 'error'
    rules['arch/schemas-local'] = ['error', { packages: ['effect/Schema'], namespaces: [], calls: presetModuleSchemaReads, imports: false, values: true }]
  }

  return {
    [at('**/*.ts')]: { deny: { calls: Object.fromEntries(presetModuleLayerCalls.map((name) => [name, presetModuleLayerMessage])) }, rules },
    [at('index.ts')]: {
      top: ['reexport'],
      deny: { imports: { './*.{adapter,driver,fake,testing,types}.ts': 'index.ts is the server entry; that file has its own subpath.' } },
      rules: { 'arch/comments-code': presetModuleDocblockFree },
    },
  }
}

function presetModuleFiles(at: (path: string) => string, module: PresetTypes.PresetEffectModule, name: string, folder: string): PresetTypes.PresetFolders {
  const kinds = presetNames(presetModuleKinds, module.kinds ?? [], 'effect.module.kinds').map(presetModuleKind)
  const parts = presetNames(presetModuleParts, module.parts ?? [], 'effect.module.parts').map(presetModuleKind)
  const fill = (kind: string) => kind.replaceAll('*', '{any}')
  const migration = module.migrations === false ? undefined : (module.migrations ?? '{date}-create-{module}-tables').replaceAll('{module}', name)
  const migrations = migration === undefined ? [] : [`${folder}/migrations/${migration}.ts`, `${folder}/migrations/${migration}.sqlite.ts`]

  const dated = optionsEscape(migration ?? '').replaceAll('\\{date\\}', '\\d{4}-\\d{2}-\\d{2}-\\d{2}-\\d{2}')

  const template = [
    `${folder}/index.ts`,
    `${folder}/${name}.ts`,
    ...kinds.map((kind) => `${folder}/${name}.${fill(kind)}.ts`),
    ...parts.map((kind) => `${folder}/${name}-{part}.${fill(kind)}.ts`),
    ...migrations,
  ]

  const dates: PresetTypes.PresetFolders = migration === undefined
    ? {}
    : {
      [at('migrations/*.ts')]: {
        rules: {
          'arch/naming-file': ['error', { pattern: `^${dated}(?:[.]sqlite)?[.]ts$`, message: 'One dated migration per module and its .sqlite.ts twin, edited in place.' }],
          'arch/comments-code': presetModuleDocblockFree,
        },
      },
    }

  return {
    [at('**/*.ts')]: {
      rules: {
        'arch/naming-file': [
          'error',
          { template, message: 'A module file is index.ts, <module>.ts, <module>.<kind>.ts, <module>-<part>.<kind>.ts or a dated migration.' },
        ],
      },
    },
    [at('*.index.ts')]: { top: ['reexport'], rules: { 'arch/comments-code': presetModuleDocblockFree } },
    [at('*.config.ts')]: {
      top: [{ kind: 'const', exported: true, names: '^(?:config|[a-z]\\w*Config)$' }],
      rules: { 'arch/comments-code': presetModuleDocblockFree },
    },
    [at('*.constants.ts')]: {
      top: ['type', { kind: 'const', exported: true, names: '^[A-Z][A-Z0-9_]*$' }],
      rules: { 'linteffect/no-string-sentinel-const': 'off', 'arch/comments-code': presetModuleDocblockFree },
    },
    [at('*.migrations.ts')]: {
      top: [{ kind: 'const', exported: true, names: '^(?:SQLITE_)?MIGRATIONS$' }],
      rules: { 'arch/comments-code': presetModuleDocblockFree },
    },
    [at('*.d.ts')]: { rules: { 'arch/comments-code': presetModuleDocblockFree } },
    [at('*.types.ts')]: {
      rules: {
        'arch/types-declarations': 'off',
        'arch/schemas-local': 'off',
        'arch/types-duplicate': 'error',
        'arch/files-types-only': ['error', { allow: ['variable', 'class'] }],
        'arch/effect-schema-first': ['error', { keep: 'Table$', rows: {} }],
        'arch/files-exports': ['error', { patterns: [`${namingPascalCase(name)}(?!\\w*(?<!ss|us|is)sTable$)\\w*`, '\\*'] }],
        'arch/files-top-level': [
          'error',
          { deny: [{ kind: 'reexport', names: '^\\./(?!{stem}-[a-z0-9-]+\\.types\\.ts$)' }], message: "Re-export only this module's <module>-<part>.types.ts." },
          { allow: ['import', 'reexport'], when: '{stem}-*.types.ts', message: 'With part files beside it, <module>.types.ts only re-exports them.' },
        ],
        'arch/comments-code': presetModuleDocblockFree,
      },
    },
    [at('*.{layer,driver,fake}.ts')]: {
      deny: { calls: Object.fromEntries(presetModuleLayerCalls.map((call) => [call, false])) },
      rules: { 'arch/files-exports': ['error', { names: ['layer'] }], 'arch/effect-layer-file': 'error' },
    },
    [at('*.driver.ts')]: { deny: { imports: { './*.driver.ts': 'A driver never imports another; <module>-config.driver.ts picks one.' } } },
    [at('*-config.driver.ts')]: { deny: { imports: { './*.driver.ts': false } } },
    [at('*.adapter.ts')]: {
      deny: { imports: { './*.{layer,driver,fake}.ts': 'An adapter is library glue; a subpath that exposes a layer is a <module>-<subpath>.index.ts.' } },
      rules: { 'arch/naming-exports': ['error', { mode: 'prefix', stem: 'full-basename', roles: ['adapter'] }] },
    },
    [at('*-react.adapter.ts')]: { rules: { 'linteffect/no-react-state': 'off' } },
    ...dates,
  }
}

function presetModuleTestFiles(tests: typeof presetModuleDefaults, name: string, flat: boolean): PresetTypes.PresetFolders {
  const { folder, support } = tests
  const kinds = presetModuleTests.flatMap((kind) => [`{name}.${kind}.ts`, `{name}.{what}.${kind}.ts`, `{name}-{part}.${kind}.ts`, `{name}-{part}.{what}.${kind}.ts`])
  const template = [...kinds, '{name}.types.ts'].map((file) => `${folder}/${file.replaceAll('{name}', name)}`)
  const supported = presetModuleSupport.flatMap((kind) => [`${name}.${kind}.ts`, `${name}-{part}.${kind}.ts`])
  const siblings = presetModuleTested.map((kind) => [`${folder}/*.${kind}.test.ts`, { rules: { 'arch/files-siblings': ['error', { require: `../src/{stem}.${kind}.ts` }] } }])

  const named: PresetTypes.PresetFolders = flat
    ? {}
    : {
      [`${folder}/*.ts`]: {
        rules: {
          'arch/naming-file': [
            'error',
            { template, message: 'A test is <module>[-<part>][.<what>].test.ts, .bench.ts or .suite.ts, or <module>.types.ts.' },
            { pattern: '^(?!.*[.]integration[.])', message: 'Name an integration test after its engine, not `.integration`.' },
          ],
        },
      },
      [`${folder}/${support}/*.ts`]: {
        rules: {
          'arch/naming-file': [
            'error',
            {
              template: [...supported, `${name}-{part}.ts`].map((file) => `${support}/${file}`),
              message: 'Support is <module>.{layer,cases,scenarios}.ts, <module>-<part>.{cases,scenarios}.ts or <module>-<api>.ts.',
            },
          ],
        },
      },
    }

  return {
    [`${folder}/**/*.{ts,tsx}`]: { rules: { 'arch/code-function-nesting': ['error', { max: 5 }], 'linteffect/no-service-layer-scatter': 'off' } },
    [`${folder}/*.test.ts`]: { top: ['describe*', 'it*', 'layer', '*Suite', '*.describe'] },
    ...Object.fromEntries(siblings),
    [`${folder}/${support}/*.ts`]: {
      top: {
        deny: ['type', 'interface', { kind: 'const', from: ['^Layer\\.', '(?:^|\\.)layer\\w*$'], names: '^(?!\\w*Layer$)', message: 'A test layer is <Role>Layer.' }],
      },
    },
    [`${folder}/**/*.bench.ts`]: {
      rules: {
        'arch/tests-assertions': 'off',
        'arch/code-inline': 'off',
        'linteffect/no-hidden-effect-execution': 'off',
        'linteffect/no-run-effect-outside-boundary': 'off',
      },
    },
    ...named,
  }
}

function presetModuleFactories(factories: string, name: string): PresetTypes.PresetFolders {
  const file = factories.replaceAll('{module}', name)

  return {
    [`${posix.dirname(file)}/*.ts`]: {
      top: [{ kind: 'const', exported: true, names: 'Factory$' }],
      rules: {
        'arch/types-declarations': 'error',
        'arch/naming-file': ['error', { template: file, message: `A module ships its factories from ${factories.replaceAll('{module}', '<module>')}.` }],
      },
    },
  }
}

function presetModuleImports(root: string, key: string, name: string): PresetTypes.PresetNamingOptions {
  const manifest = presetManifest(root, key).name
  const scope = manifest?.includes(name) ? manifest.replace(name, '{package}') : undefined

  const packages = scope === undefined
    ? {}
    : {
      [`${scope}/schema`]: { name: '{Package}Types', namespace: false },
      [`${scope}/testing/{driver}`]: '{Package}{Driver}Testing',
      [`${scope}/{subpath}`]: '{Package}{Subpath}',
      [scope]: '{Package}',
    }

  return {
    imports: {
      ...packages,
      '**/index.ts': { name: false },
      '**/support/{file}.ts': { name: '{File}', namespace: false },
      '**/{module}-config.driver.ts': { name: '{Module}Drivers', namespace: false },
      '**/{file}.layer.ts': { name: ['{File}', '{File}Layer'], namespace: false },
      '**/{file}.ts': { name: '{File}', namespace: false, drop: '[.](?:driver|adapter|index)$' },
    },
  }
}

function presetModulePaths(glob: string): string[] {
  const braces = /\{([^{}]*)\}/.exec(glob)

  return braces ? braces[1].split(',').map((option) => glob.replace(braces[0], option)) : [glob]
}

export function presetModuleErrors(errors: PresetTypes.PresetEffectErrors | undefined, fallback: string, constructors: string[]): PresetTypes.PresetFolders {
  const open: PresetTypes.PresetFolder = { deny: { calls: Object.fromEntries(constructors.map((name) => [name, false])) } }

  if (!errors) {
    return { [fallback]: open }
  }

  const classes: PresetTypes.PresetFolder = {
    top: [{ kind: 'class', exported: true }, { kind: 'const', exported: true }, 'type'],
    rules: {
      'arch/comments-code': ['error', { why: false, jsdoc: false, allow: ['^\\s*SAFETY: '] }],
      'arch/files-exports': ['error', { patterns: ['{Domain}\\w*', '\\w+Data'] }],
      'arch/naming-labels': [
        'error',
        {
          labels: [
            { callee: ['Tagged', '*.Tagged'], property: 'tag', name: '{name}' },
            { callee: ['Tagged', '*.Tagged'], property: 'code', pattern: '^[A-Z][A-Z0-9_]*$' },
          ],
        },
      ],
    },
  }

  if (errors.base === undefined) {
    return { [errors.files]: presetMerge(open, classes) }
  }

  return {
    [errors.files]: classes,
    [errors.base]: { ...open, rules: { 'arch/files-top-level': 'off', 'arch/files-exports': 'off', 'arch/naming-labels': 'off' } },
  }
}

function presetModuleName(key: string, module: PresetTypes.PresetEffectModule): string | undefined {
  const folder = posix.basename(key)

  if (module.name === 'flat') {
    return folder
  }

  return Object.values(namingTemplatePattern(module.name ?? '{module}')?.exec(folder)?.groups ?? {}).at(0)
}

export function presetModuleConventions(root: string, key: string, value: PresetTypes.PresetFolder): PresetTypes.PresetFolders {
  const options = value.effect instanceof Object ? value.effect : {}
  const module = typeof options.module === 'string' ? { name: options.module } : options.module
  const name = module && presetModuleName(key, module)

  if (!module || name === undefined) {
    return {}
  }

  const flat = module.name === 'flat'
  const source = posix.relative(key, presetSource(root, key, value.source)) || '.'
  const at = (path: string) => (source === '.' ? path : posix.join(source, path))
  const spans = presetModuleSpans(module.spans, flat ? '{stem}' : namingCamelCase(name))
  const tests = module.tests === false ? undefined : { ...presetModuleDefaults, ...module.tests }
  const surface = `${optionsEscape(posix.join(key, source))}/${name}(?:[.](?:handlers|middlewares))?[.]ts$`

  const parts: PresetTypes.PresetFolders[] = [
    presetModuleSource(at, flat, spans),
    flat ? {} : presetModuleFiles(at, module, name, posix.basename(posix.join(key, source))),
    tests ? presetModuleTestFiles(tests, name, flat) : {},
    tests && !flat ? presetModuleFactories(tests.factories, name) : {},
  ]

  const merged: PresetTypes.PresetFolders = {}

  for (const [glob, folder] of parts.flatMap((part) => Object.entries(part))) {
    for (const path of presetModulePaths(glob)) {
      merged[path] = path in merged ? presetMerge(merged[path], folder) : folder
    }
  }

  return {
    '.': {
      effect: { exports: flat ? '(?!)' : surface },
      types: { placement: false },
      rules: { 'arch/comments-code': ['error', { why: false, jsdoc: true, allow: ['^\\s*SAFETY: ', '^\\s*@module-tag '] }] },
      naming: module.imports === false ? {} : presetModuleImports(root, key, name),
    },
    ...merged,
  }
}
