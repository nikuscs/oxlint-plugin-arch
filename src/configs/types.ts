import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import { presetScopes, presetOverride } from '../utils/helpers/preset.ts'

export function presetTypesConfig(context: PresetContext): PresetPolicies {
  const {
    options,
    web,
    backend,
    app,
    appFiles,
    webFiles,
    services,
    utilities,
    types,
    ui,
    testFiles,
    safetyFiles,
    components,
    hooks,
    publicEntrypoints,
  } = context
  const policies: PresetPolicies = {}
  policies.typePlacement = [
    presetOverride(appFiles, { 'arch/no-type-declarations': 'error' }, [
      ...types,
      ...components,
      ...hooks,
      ...services,
      ...ui,
      ...testFiles,
    ]),
    presetOverride(services, { 'modules/service-types': 'error' }, [...utilities, ...testFiles]),
    presetOverride(
      [...components, ...hooks],
      {
        'modules/local-type-alias': 'error',
        'modules/pascal-interface': 'error',
        'arch/declaration-name': [
          'error',
          {
            kinds: ['interface'],
            stem: 'before-first-dot',
            normalize: 'remove-separators',
          },
        ],
      },
      [...ui, ...testFiles],
    ),
    presetOverride(
      presetScopes(app, '**/*.types.ts'),
      {
        'arch/no-restricted-files': ['error', { message: 'Domain types belong in src/types.' }],
      },
      [...types, ...ui],
    ),
    presetOverride(
      presetScopes(app, '**/*.{utils,constants}.ts'),
      {
        'arch/no-type-declarations': 'error',
      },
      [...ui, ...testFiles],
    ),
    presetOverride([...presetScopes(backend, 'types/**/*.types.ts'), ...presetScopes(app, '**/*.constants.ts')], {
      'arch/no-top-level-functions': ['error', { banReExports: false }],
    }),
    presetOverride(presetScopes(web, 'types/**/*.types.ts'), {
      'arch/no-runtime-in-types': ['error', { runtimeImports: 'ban', allowImportSources: [], banReExports: true }],
    }),
  ]

  policies.typeSafety = [
    presetOverride(safetyFiles, {
      'typescript/no-explicit-any': 'error',
      'typescript/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-expect-error': true,
          'ts-check': false,
        },
      ],
      'modules/no-unknown': 'error',
      'modules/shape-suffix': 'error',
      'arch/no-imported-type-alias': 'error',
      'arch/no-literal-in': 'error',
      'arch/no-promise-all-mutation': 'error',
      'arch/no-restricted-constructor': ['error', { constructors: ['Error'], checkCalls: true }],
      'dillon-anti-slop/no-chained-type-assertions': 'error',
      'dillon-anti-slop/no-conditional-empty-object-spread': 'error',
      'dillon-anti-slop/no-known-value-widening': 'error',
      'dillon-anti-slop/no-reflect-apply': 'error',
      'dillon-anti-slop/no-reflect-get': 'error',
      'dillon-anti-slop/no-runtime-typeof': 'error',
      'dillon-anti-slop/no-unknown-parameters': 'error',
      'dillon-anti-slop/no-unknown-returns': 'error',
      'dillon-anti-slop/no-unknown-type-aliases': 'error',
      'dillon-anti-slop/no-unsafe-dictionary-type': 'error',
      'dillon-anti-slop/no-widen-then-assert': 'error',
      'dillon-anti-slop/require-safety-comment-for-type-assertion': 'error',
    }),
  ]

  policies.schemas = [
    presetOverride(
      appFiles,
      {
        'arch/no-local-schema-construction': ['error', { packages: ['zod'], namespaces: ['z'] }],
      },
      [...presetScopes(backend, 'types/**'), ...ui],
    ),
    presetOverride(webFiles, {
      'arch/no-rederive-schema': [
        'error',
        {
          from: publicEntrypoints,
          namespaces: ['z'],
          operators: ['infer', 'input'],
        },
      ],
    }),
    presetOverride(presetScopes(backend, 'services/**/*.ts'), {
      'arch/no-unescaped-like': [
        'error',
        {
          methods: ['like', 'ilike'],
          operatorMethods: ['where'],
          sanitizers: options.sql?.likeSanitizers ?? ['escapeLikeWildcards'],
          allowSanitizedBindings: true,
        },
      ],
    }),
    ...(options.orpc?.publicProcedureFiles?.length
      ? [
          presetOverride(options.orpc?.publicProcedureFiles, {
            'arch/require-orpc-output': [
              'error',
              {
                handlerMethod: 'handler',
                outputMethod: 'output',
                composers: options.orpc?.outputSchemaComposers ?? [],
              },
            ],
          }),
        ]
      : []),
  ]
  return policies
}
