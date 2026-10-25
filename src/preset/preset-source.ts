import { presetExtensions, presetFormattingRules, presetImportRules } from './preset.constants.ts'
import { presetOverride, presetScopes } from './preset.utils.ts'
import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'

export function presetSourceConfig(context: PresetContext): PresetPolicies {
  const { options, web, scripts, app, appFiles, backendFiles, ui, safetyFiles, publicEntrypoints, baseImports } =
    context

  const allFiles = [`**/${presetExtensions}`]
  const { semi = 'always', quotes = 'single' } = options.formatting ?? {}
  const trivialFunctions = { mode: 'precise', allowAsync: false, allowCallees: [] }
  return {
    formatting: [
      presetOverride(allFiles, {
        ...presetFormattingRules,
        'eslint-js/semi': ['error', semi],
        'eslint-js/quotes': ['error', quotes, { avoidEscape: true }],
      }),
    ],
    statementLayout: [
      presetOverride(allFiles, {
        'arch/layout-padding': ['error', { multilineVariables: true }],
        'arch/layout-object': ['error', { minProperties: 3, scope: 'call-args' }],
        'arch/layout-call-array': ['error', { callees: ['Promise.all'], minElements: 2 }],
        'arch/layout-key-value': 'error',
      }),
    ],
    imports: [
      presetOverride(allFiles, {
        ...presetImportRules,
        'arch/types-namespace-import': ['error', { max: 3 }],
        'no-restricted-imports': ['error', { patterns: baseImports }],
        'import-extra/no-relative-packages': 'error',
        'perfectionist/sort-imports': [
          'error',
          {
            type: 'natural',
            ignoreCase: true,
            newlinesBetween: 0,
            environment: 'bun',
            internalPattern: options.imports?.internalSortPatterns ?? [
              '^@/.*',
              '^#.*',
              '^~icons/.*',
              ...publicEntrypoints.map((path) => `^${path.split('/').slice(0, 2).join('/')}/`),
            ],
            groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index'], 'type'],
          },
        ],
      }),
    ],
    comments: [
      presetOverride(appFiles, { 'arch/comments': ['error', { allowWhy: false, allowPatterns: ['^\\s*SAFETY: '] }] }, ui),
      presetOverride(presetScopes(app, '**/*.{types,constants}.ts'), {
        'arch/comments': ['error', { allowWhy: false }],
      }),
      presetOverride(allFiles, { 'arch/comments-directives': 'error' }),
    ],
    trivialFunctions: [
      presetOverride(appFiles, { 'arch/code-trivial-functions': ['error', trivialFunctions] }, ui),
      presetOverride(
        [...presetScopes(web, 'services/**/*.{client,server,rsc}.ts'), ...presetScopes(web, 'services/**/*.rsc.tsx')],
        { 'arch/code-trivial-functions': ['error', { ...trivialFunctions, checkServiceMethods: true }] },
        ui,
      ),
    ],
    mutableState: [presetOverride(safetyFiles, { 'arch/code-mutable-state': ['error', { kinds: ['let', 'var'] }] }, ui)],
    backend: [
      presetOverride(backendFiles, { 'arch/code-switch': 'error' }, options.cliFiles),
      presetOverride(allFiles, { 'no-console': 'error' }, [...presetScopes(scripts, '**'), ...(options.cliFiles ?? [])]),
      presetOverride(safetyFiles, { 'arch/code-double-negation': 'error' }, ui),
    ],
  }
}
