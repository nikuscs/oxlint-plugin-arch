import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import { presetOverride, presetScopes } from '../utils/helpers/preset.ts'
import {
  presetExtensions,
  presetFormattingRules,
  presetImportRules,
} from '../constants/preset.constants.ts'

export function presetSourceConfig(context: PresetContext): PresetPolicies {
  const {
    options,
    architecture,
    app,
    appFiles,
    backendFiles,
    ui,
    safetyFiles,
    publicEntrypoints,
    baseImports,
  } = context
  const policies: PresetPolicies = {}
  policies.formatting = [
    presetOverride([`**/${presetExtensions}`], presetFormattingRules),
  ]

  policies.layout = [
    presetOverride(
      [`**/${presetExtensions}`],
      {
        'arch/padding-between-statements': ['error', { multilineVariables: true }],
        'arch/object-multiline': [
          'error',
          { minProperties: 3, scope: 'call-args' },
        ],
        'arch/call-array-multiline': [
          'error',
          { callees: ['Promise.all'], minElements: 2 },
        ],
        'arch/key-value-same-line': 'error',
      },
    ),
  ]

  policies.imports = [
    presetOverride([`**/${presetExtensions}`], {
      ...presetImportRules,
      'no-restricted-imports': ['error', { patterns: baseImports }],
      'import-extra/no-relative-packages': 'error',
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          ignoreCase: true,
          newlinesBetween: 0,
          environment: 'bun',
          internalPattern: options.internalPatterns ?? [
            '^@/.*',
            '^#.*',
            '^~icons/.*',
            ...publicEntrypoints.map(
              (path) => `^${path.split('/').slice(0, 2).join('/')}/`,
            ),
          ],
          groups: [
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'type',
          ],
        },
      ],
    }),
  ]

  policies.comments = [
    presetOverride(
      appFiles,
      {
        'arch/no-comments': [
          'error',
          { allowWhy: false, allowPatterns: ['^\\s*SAFETY: '] },
        ],
      },
      ui,
    ),
    presetOverride(presetScopes(app, '**/*.{types,constants}.ts'), {
      'arch/no-comments': ['error', { allowWhy: false }],
    }),
    presetOverride([`**/${presetExtensions}`], {
      'modules/reasoned-directives': 'error',
    }),
  ]

  policies.wrappers = [
    presetOverride(
      appFiles,
      {
        'arch/no-trivial-functions': [
          'error',
          { allowAsync: false, allowCallees: [] },
        ],
      },
      ui,
    ),
  ]

  policies.mutableState = [
    presetOverride(
      safetyFiles,
      { 'arch/no-module-mutable-state': ['error', { kinds: ['let', 'var'] }] },
      ui,
    ),
  ]

  policies.backendRules = [
    presetOverride(
      backendFiles,
      { 'modules/backend-switch': 'error' },
      options.cli,
    ),
    presetOverride([`**/${presetExtensions}`], { 'no-console': 'error' }, [
      ...(architecture.scripts ? [architecture.scripts + '/**'] : []),
      ...(options.cli ?? []),
    ]),
    presetOverride(safetyFiles, { 'modules/double-negation': 'error' }, ui),
  ]
  return policies
}
