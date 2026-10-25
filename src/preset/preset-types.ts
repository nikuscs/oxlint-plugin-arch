import { presetOverride, presetScopes } from './preset.utils.ts'
import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'

export function presetTypesConfig(context: PresetContext): PresetPolicies {
  const { options, web, backend, packageSources, serviceRoots, app, appFiles, webFiles, services, utilities, types } =
    context

  const { ui, testFiles, safetyFiles, components, hooks, publicEntrypoints, tanstackWeb, nextWeb } = context
  const schemaOwners = backend.length ? backend : nextWeb
  const runtimeFreeTypes = backend.length ? web : tanstackWeb
  const colocatedTypes = options.modules?.colocatedTypeFiles ?? []
  const orpcFiles = options.orpc?.publicProcedureFiles ?? []
  return {
    typePlacement: [
      presetOverride(appFiles, { 'arch/types-declarations': 'error' }, [
        ...types,
        ...colocatedTypes,
        ...components,
        ...hooks,
        ...services,
        ...ui,
        ...testFiles,
      ]),
      presetOverride(services, { 'arch/types-service': 'error' }, [...utilities, ...testFiles]),
      presetOverride(
        [...components, ...hooks],
        {
          'arch/types-local-alias': 'error',
          'arch/naming-types': 'error',
          'arch/naming-declarations': [
            'error',
            { kinds: ['interface'], stem: 'before-first-dot', normalize: 'remove-separators' },
          ],
        },
        [...ui, ...testFiles],
      ),
      ...(options.react?.componentProps === false
        ? []
        : [presetOverride(components, { 'arch/react-props': ['error', { filePrefix: true }] }, [...ui, ...testFiles])]),
      presetOverride(
        presetScopes(app, '**/*.types.ts'),
        { 'arch/files-restricted': ['error', { message: 'Domain types belong in src/types.' }] },
        [...types, ...colocatedTypes, ...ui],
      ),
      presetOverride(presetScopes(app, '**/*.{utils,constants}.ts'), { 'arch/types-declarations': 'error' }, [
        ...ui,
        ...testFiles,
      ]),
      presetOverride(
        [
          ...presetScopes([...schemaOwners, ...packageSources], 'types/**/*.types.ts'),
          ...colocatedTypes,
          ...presetScopes(app, '**/*.constants.ts'),
        ],
        { 'arch/files-no-functions': ['error', { banReExports: false }] },
      ),
      ...(runtimeFreeTypes.length
        ? [
          presetOverride(presetScopes(runtimeFreeTypes, 'types/**/*.types.ts'), {
            'arch/files-types-only': ['error', { runtimeImports: 'ban', allowImportSources: [], banReExports: true }],
          }),
        ]
        : []),
    ],
    typeSafety: [
      presetOverride(safetyFiles, {
        'typescript/no-explicit-any': 'error',
        'typescript/ban-ts-comment': [
          'error',
          { 'ts-ignore': true, 'ts-nocheck': true, 'ts-expect-error': true, 'ts-check': false },
        ],
        'arch/types-unknown': 'error',
        'arch/naming-shape': 'error',
        'arch/types-imported-alias': 'error',
        'arch/code-literal-in': 'error',
        'arch/code-promise-mutation': 'error',
        'arch/code-constructor': ['error', { constructors: ['Error'], checkCalls: true }],
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
    ],
    schemas: [
      presetOverride(
        appFiles,
        { 'arch/schemas-local': ['error', { packages: ['zod'], namespaces: ['z'] }] },
        [...presetScopes([...schemaOwners, ...packageSources], 'types/**'), ...colocatedTypes, ...ui],
      ),
      presetOverride([...webFiles, ...presetScopes(packageSources)], {
        'arch/schemas-rederive': ['error', { from: publicEntrypoints, namespaces: ['z'], operators: ['infer', 'input'] }],
      }),
      presetOverride(presetScopes(serviceRoots, 'services/**/*.ts'), {
        'arch/backend-sql-like': [
          'error',
          {
            methods: ['like', 'ilike'],
            operatorMethods: ['where'],
            sanitizers: options.sql?.likeSanitizers ?? ['escapeLikeWildcards'],
            allowSanitizedBindings: true,
          },
        ],
      }),
      ...(orpcFiles.length
        ? [
          presetOverride(orpcFiles, {
            'arch/backend-orpc-output': [
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
    ],
  }
}
