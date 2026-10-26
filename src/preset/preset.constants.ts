import type * as PresetTypes from '../types/preset.types.ts'

export const presetExtensions = '*.{ts,tsx,mts,cts}'

export const presetCommonRules: PresetTypes.PresetRules = {
  'vitest/expect-expect': 'off',
  'vitest/no-standalone-expect': 'off',
  'jsx-a11y/no-noninteractive-tabindex': 'error',
  'no-case-declarations': 'error',
  'no-empty': 'error',
  'no-fallthrough': 'error',
  'no-prototype-builtins': 'error',
  'no-regex-spaces': 'error',
  'array-callback-return': 'error',
  'default-case-last': 'error',
  eqeqeq: 'error',
  'no-alert': 'error',
  'no-constructor-return': 'error',
  'no-else-return': 'error',
  'no-extend-native': 'error',
  'no-extra-bind': 'error',
  'no-extra-label': 'error',
  'no-labels': 'error',
  'no-lone-blocks': 'error',
  'no-new': 'error',
  'no-new-func': 'error',
  'no-new-wrappers': 'error',
  'no-param-reassign': 'error',
  'no-proto': 'error',
  'no-return-assign': 'error',
  'no-script-url': 'error',
  'no-self-compare': 'error',
  'no-sequences': 'error',
  'no-useless-call': 'error',
  'no-useless-concat': 'error',
  'no-useless-return': 'error',
  'no-useless-computed-key': 'error',
  'no-var': 'error',
  'object-shorthand': 'error',
  'prefer-const': 'error',
  'prefer-numeric-literals': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'prefer-template': 'error',
  'symbol-description': 'error',
  'no-promise-executor-return': 'error',
  'no-template-curly-in-string': 'error',
  'new-cap': ['error', { capIsNew: false }],
  'no-lonely-if': 'error',
  'no-multi-assign': 'error',
  'no-nested-ternary': 'error',
  'no-unneeded-ternary': 'error',
  'prefer-object-spread': 'error',
  'no-label-var': 'error',
  'no-await-in-loop': 'error',
  curly: 'error',
  'typescript/no-array-constructor': 'error',
  'typescript/no-dynamic-delete': 'error',
  'typescript/no-empty-object-type': 'error',
  'typescript/no-invalid-void-type': 'error',
  'typescript/no-mixed-enums': 'error',
  'typescript/no-namespace': 'error',
  'typescript/no-non-null-asserted-nullish-coalescing': 'error',
  'typescript/no-non-null-assertion': 'error',
  'typescript/no-require-imports': 'error',
  'typescript/no-unnecessary-boolean-literal-compare': 'error',
  'typescript/no-unnecessary-condition': 'error',
  'typescript/no-unnecessary-template-expression': 'error',
  'typescript/no-unnecessary-type-arguments': 'error',
  'typescript/no-unnecessary-type-assertion': 'error',
  'typescript/no-unnecessary-type-constraint': 'error',
  'typescript/no-unsafe-enum-comparison': 'error',
  'typescript/no-unsafe-function-type': 'error',
  'typescript/no-unused-expressions': 'error',
  'no-unused-vars': [
    'error',
    { args: 'after-used', argsIgnorePattern: '^_', ignoreRestSiblings: false, vars: 'all', varsIgnorePattern: '^_' },
  ],
  'typescript/no-useless-constructor': 'error',
  'typescript/prefer-literal-enum-member': 'error',
  'typescript/prefer-promise-reject-errors': 'error',
  'typescript/prefer-reduce-type-parameter': 'error',
  'typescript/prefer-return-this-type': 'error',
  'typescript/restrict-plus-operands': 'error',
  'typescript/return-await': ['error', 'error-handling-correctness-only'],
  'typescript/unbound-method': 'error',
  'typescript/use-unknown-in-catch-callback-variable': 'error',
  'typescript/unified-signatures': 'error',
  'typescript/adjacent-overload-signatures': 'error',
  'typescript/array-type': 'error',
  'typescript/ban-tslint-comment': 'error',
  'typescript/class-literal-property-style': 'error',
  'typescript/consistent-generic-constructors': 'error',
  'typescript/consistent-indexed-object-style': 'error',
  'typescript/consistent-type-assertions': 'error',
  'typescript/consistent-type-definitions': 'error',
  'typescript/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', disallowTypeAnnotations: true, fixStyle: 'separate-type-imports' },
  ],
  'typescript/no-confusing-non-null-assertion': 'error',
  'typescript/no-empty-function': 'error',
  'typescript/no-inferrable-types': 'error',
  'typescript/non-nullable-type-assertion-style': 'error',
  'typescript/prefer-find': 'error',
  'typescript/prefer-for-of': 'error',
  'typescript/prefer-function-type': 'error',
  'typescript/prefer-includes': 'error',
  'typescript/prefer-nullish-coalescing': 'error',
  'typescript/prefer-optional-chain': 'error',
  'typescript/prefer-regexp-exec': 'error',
  'typescript/prefer-string-starts-ends-with': 'error',
  'typescript/consistent-type-exports': 'error',
  'typescript/switch-exhaustiveness-check': 'error',
  'typescript/default-param-last': 'error',
  'typescript/no-loop-func': 'error',
  'typescript/no-shadow': 'error',
  'unicorn/prefer-at': 'error',
  'unicorn/prefer-node-protocol': 'error',
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'error',
  'oxc/no-accumulating-spread': 'error',
  '@regru/prefer-early-return/prefer-early-return': ['error', { maximumStatements: 1 }],
  'tsdoc/syntax': 'error',
  '@eslint-community/eslint-comments/no-aggregating-enable': 'error',
  '@eslint-community/eslint-comments/no-duplicate-disable': 'error',
  '@eslint-community/eslint-comments/no-unused-enable': 'error',
}

export const presetFormattingRules: PresetTypes.PresetRules = {
  'eslint-js/padding-line-between-statements': [
    'error',
    { blankLine: 'always', prev: ['multiline-const', 'multiline-let'], next: '*' },
    { blankLine: 'always', prev: '*', next: ['multiline-const', 'multiline-let'] },
  ],
  'eslint-js/indent': ['error', 2, { MemberExpression: 1, SwitchCase: 1, flatTernaryExpressions: true }],
  'eslint-js/semi': ['error', 'always'],
  'eslint-js/quotes': ['error', 'single', { avoidEscape: true }],
  'eslint-js/comma-dangle': ['error', 'always-multiline'],
  'eslint-js/no-trailing-spaces': 'error',
  'eslint-js/no-multiple-empty-lines': ['error', { max: 1 }],
  'eslint-js/eol-last': ['error', 'always'],
  'eslint-js/no-multi-spaces': 'error',
  'eslint-js/arrow-spacing': 'error',
  'eslint-js/block-spacing': 'error',
  'eslint-js/comma-spacing': ['error', { before: false, after: true }],
  'eslint-js/key-spacing': ['error', { beforeColon: false, afterColon: true }],
  'eslint-js/keyword-spacing': ['error', { before: true, after: true }],
  'eslint-js/object-curly-spacing': ['error', 'always'],
  'eslint-js/semi-spacing': ['error', { before: false, after: true }],
  'eslint-js/space-before-blocks': 'error',
  'eslint-js/space-before-function-paren': ['error', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
  'eslint-js/space-infix-ops': 'error',
  'eslint-js/space-in-parens': ['error', 'never'],
  'eslint-js/template-curly-spacing': ['error', 'never'],
  'eslint-js/rest-spread-spacing': ['error', 'never'],
  'eslint-js/computed-property-spacing': ['error', 'never'],
  'eslint-js/brace-style': ['error', '1tbs', { allowSingleLine: false }],
  'eslint-js/arrow-parens': ['error', 'always'],
  'eslint-js/no-extra-semi': 'error',
  'eslint-js/no-floating-decimal': 'error',
  'eslint-js/dot-location': ['error', 'property'],
  'eslint-js/no-whitespace-before-property': 'error',
  'eslint-js/object-curly-newline': ['error', { consistent: true }],
  'eslint-js/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
  'eslint-js/max-len': [
    'error',
    {
      code: 160,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true,
      ignoreComments: true,
    },
  ],
}

export const presetReactRules: PresetTypes.PresetRules = {
  'react/display-name': 'error',
  'react/jsx-no-comment-textnodes': 'error',
  'react/jsx-no-target-blank': 'error',
  'react/no-unknown-property': 'error',
  'react/button-has-type': 'error',
  'react/jsx-boolean-value': 'error',
  'react/jsx-curly-brace-presence': 'error',
  'react/jsx-fragments': 'error',
  'react/jsx-no-useless-fragment': 'error',
  'react/jsx-pascal-case': 'error',
  'react/self-closing-comp': 'error',
  'react-perf/jsx-no-new-object-as-prop': 'off',
  'react-perf/jsx-no-new-array-as-prop': 'off',
  'react-perf/jsx-no-new-function-as-prop': 'off',
  'react-perf/jsx-no-jsx-as-prop': 'off',
  'react-extra/jsx-sort-props': [
    'error',
    { ignoreCase: true, callbacksLast: true, shorthandFirst: true, multiline: 'ignore', locale: 'auto' },
  ],
  'react-extra/jsx-first-prop-new-line': ['error', 'multiline'],
  'react-extra/jsx-max-props-per-line': ['error', { when: 'multiline', maximum: 1 }],
  'react-extra/jsx-indent-props': ['error', 2],
  'react-extra/jsx-closing-bracket-location': ['error', 'line-aligned'],
  'react-extra/jsx-wrap-multilines': [
    'error',
    {
      declaration: 'parens-new-line',
      assignment: 'parens-new-line',
      return: 'parens-new-line',
      arrow: 'parens-new-line',
      condition: 'parens-new-line',
      logical: 'parens-new-line',
      prop: 'parens-new-line',
    },
  ],
  'react-extra/jsx-curly-newline': ['error', 'consistent'],
  'react-extra/jsx-no-leaked-render': 'error',
  'react-extra/no-unstable-nested-components': 'error',
  'react-extra/function-component-definition': ['error', { namedComponents: 'function-declaration' }],
  'react-extra/hook-use-state': 'error',
  'react-extra/no-deprecated': 'error',
  'react-extra/jsx-uses-vars': 'off',
  'react-extra/require-render-return': 'error',
  'svg-jsx/camel-case-colon': 'error',
  'svg-jsx/no-style-string': 'error',
}

export const presetEffectsRules: PresetTypes.PresetRules = {
  'react-you-might-not-need-an-effect/no-adjust-state-on-prop-change': 'error',
  'react-you-might-not-need-an-effect/no-reset-all-state-on-prop-change': 'error',
  'react-you-might-not-need-an-effect/no-event-handler': 'error',
  'react-you-might-not-need-an-effect/no-pass-live-state-to-parent': 'error',
  'react-you-might-not-need-an-effect/no-pass-data-to-parent': 'error',
  'react-you-might-not-need-an-effect/no-initialize-state': 'error',
  'react-you-might-not-need-an-effect/no-chain-state-updates': 'error',
  'react-you-might-not-need-an-effect/no-derived-state': 'error',
}

export const presetTailwindRules = {
  'tailwindcss/enforce-canonical': 'error',
  'tailwindcss/enforce-sort-order': 'error',
  'tailwindcss/enforce-shorthand': 'error',
  'tailwindcss/no-conflicting-classes': 'error',
  'tailwindcss/no-duplicate-classes': 'error',
  'tailwindcss/no-unknown-classes': 'off',
  'tailwindcss/no-unnecessary-whitespace': 'error',
  'tailwindcss/no-deprecated-classes': 'error',
} satisfies PresetTypes.PresetRules

export const presetImportRules: PresetTypes.PresetRules = {
  'import/first': 'error',
  'import/no-absolute-path': 'error',
  'import/no-mutable-exports': 'error',
  'import/no-self-import': 'error',
  'import/no-duplicates': 'error',
  'import/no-named-as-default': 'error',
  'import/no-named-as-default-member': 'error',
  'import/consistent-type-specifier-style': 'error',
  'unused-imports/no-unused-imports': 'error',
  'import-extra/no-useless-path-segments': 'error',
  'import-extra/no-relative-packages': 'error',
  'import-extra/newline-after-import': 'error',
  'perfectionist/sort-named-imports': ['error', { type: 'natural', ignoreCase: true }],
}

export const presetNamingRules: PresetTypes.PresetRules = {
  'unicorn/filename-case': ['error', { case: 'kebabCase' }],
}

export const presetTestRules: PresetTypes.PresetRules = {
  'jest/expect-expect': 'off',
  'jest/no-conditional-expect': 'off',
  'jest/no-disabled-tests': 'off',
  'jest/no-export': 'off',
  'jest/no-standalone-expect': 'off',
  'jest/require-to-throw-message': 'off',
  'vitest/no-conditional-expect': 'error',
  'vitest/require-mock-type-parameters': 'error',
}

const presetModuleMockingApis = ['*.mock', '*.doMock', '*.unstable_mockModule']

export const presetTestMockingApis = {
  modules: presetModuleMockingApis,
  strict: [...presetModuleMockingApis, '*.spyOn', '*.stubGlobal', '*.stubEnv'],
} satisfies Record<PresetTypes.PresetMockingPreset, string[]>

export const presetTestMockingAllow = {
  modules: [],
  strict: [{ files: ['**/*.driver.test.ts'], apis: ['*'] }],
} satisfies Record<PresetTypes.PresetMockingPreset, PresetTypes.PresetMockingException[]>

export const presetStrictMockingMessage =
  'Inject a fake driver through the dependencies of the code under test instead of mocking or stubbing.'

export const presetNextHandlerMethods = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']

export const presetNextSegmentConfig = [
  'generateStaticParams', 'dynamic', 'dynamicParams', 'revalidate', 'fetchCache', 'runtime', 'preferredRegion',
  'maxDuration',
]

export const presetNextSegmentExports = [
  'generateMetadata', 'metadata', 'generateViewport', 'viewport', ...presetNextSegmentConfig,
]

export const presetExportPrefix = {
  stem: 'before-first-dot',
  roles: ['constants', 'utils', 'handler', 'service', 'types'],
  separators: ['.', '-'],
  normalize: 'remove-separators',
  allow: '^(make[A-Z]|\\*$)',
}

export const presetGeneratedFiles = [
  '**/*.generated.*', '**/*.gen.*', '**/*.d.ts', '**/routes.tree.ts', '**/routeTree.gen.ts', '**/paraglide/**',
]

export const presetBuiltinFileRoles = [
  'service', 'client', 'server', 'rsc', 'utils', 'action', 'query', 'types', 'constants', 'handler', 'test', 'spec',
]

export const presetShorthandOptions = [['tests', 'mocking', 'preset'], ['backend', 'registry', 'file']] as const

export const presetOutputFolders = ['dist', 'build', 'coverage', '.output']

export const presetLiteralSegment = /^(?!\.{1,2}$)[a-zA-Z0-9._][a-zA-Z0-9._-]*$/

export const presetIllustrationPalette = [
  'text-color', 'bg-color', 'gradient-from', 'gradient-via', 'gradient-to', 'border-color', 'divide-color',
  'outline-color', 'ring-color', 'ring-offset-color', 'shadow', 'shadow-color', 'inset-shadow', 'inset-shadow-color',
  'drop-shadow', 'drop-shadow-color', 'fill', 'stroke', 'bg-image', 'bg-size', 'bg-position', 'mask-image', 'blur',
  'saturate',
]

export const presetGroupOrder: PresetTypes.PresetGroupName[] = [
  'style', 'imports', 'types', 'layout', 'naming', 'comments', 'basics', 'console', 'tests', 'schemas', 'sql', 'orpc',
  'react', 'forms', 'tanstack', 'next', 'expo', 'backend', 'tailwind', 'shadcn', 'kit', 'limits', 'deny', 'externals',
]

export const presetDefaultGroups: PresetTypes.PresetGroupName[] = [
  'layout', 'limits', 'style', 'basics', 'naming', 'comments', 'types', 'imports', 'tests', 'deny', 'externals',
]

export const presetExternals = [
  '@napi-rs/*', '@node-rs/*', '@takumi-rs/*', 'sharp', 'pg', 'ioredis', 'bullmq', 'tiny-secp256k1', 'ssh2', 'playwright',
  'playwright-core',
]

export const presetGroupOptions: PresetTypes.PresetGroupDefaults = {
  layout: { level: 'error', services: undefined, hooks: undefined, components: undefined, suffixes: [], strict: false, operations: 'flat', service: ['make{Domain}Service', '{Domain}Service'] },
  limits: { level: 'error', lines: 400, types: 1000, complexity: 32 },
  style: { level: 'error', quotes: 'single', semicolons: true, multiline: true, padding: true, dashes: true },
  basics: { level: 'error', trivial: true, state: true, switch: true, negation: true },
  naming: { level: 'error', files: true, exports: true, folders: true, unique: undefined },
  comments: { level: 'error', directives: true },
  types: { level: 'error', placement: true, safety: true, colocated: [] },
  imports: { level: 'error', sort: true, boundaries: true, aliases: {}, internal: undefined },
  tests: { level: 'error', assertions: [], functions: [], mocking: 'modules', titles: true, fixtures: true },
  react: { level: 'error', a11y: true, effects: true, memo: undefined, props: true, perf: undefined, compiler: true },
  tanstack: { level: 'error', server: [], client: [], dynamic: [] },
  next: { level: 'error', server: [], client: [], dynamic: [] },
  expo: { level: 'error', server: [] },
  tailwind: { level: 'error', css: undefined, rem: 16 },
  shadcn: { level: 'error', ui: '@/components/ui', components: ['^@/components/'] },
  kit: { level: 'error' },
  backend: { level: 'error', exports: undefined, registry: undefined, writes: ['insertInto', 'updateTable', 'deleteFrom', 'mergeInto', 'replaceInto', 'dispatch', 'send'] },
  orpc: { level: 'error', public: [], composers: [], client: undefined },
  schemas: { level: 'error' },
  forms: { level: 'error', resolver: 'standardSchemaResolver' },
  sql: { level: 'error', sanitizers: ['escapeLikeWildcards'] },
  console: { level: 'error' },
  deny: { level: 'error', imports: {}, calls: {} },
  externals: { level: 'error', packages: presetExternals },
}

export const presetFolderKeys = ['severity', 'source', 'services', 'rules']

export const presetA11yRules = [
  'alt-text', 'anchor-has-content', 'anchor-is-valid', 'aria-activedescendant-has-tabindex', 'aria-props',
  'aria-proptypes', 'aria-role', 'aria-unsupported-elements', 'autocomplete-valid', 'click-events-have-key-events',
  'control-has-associated-label', 'heading-has-content', 'html-has-lang', 'iframe-has-title', 'img-redundant-alt',
  'interactive-supports-focus', 'label-has-associated-control', 'lang', 'media-has-caption',
  'mouse-events-have-key-events', 'no-access-key', 'no-aria-hidden-on-focusable', 'no-autofocus',
  'no-distracting-elements', 'no-interactive-element-to-noninteractive-role',
  'no-noninteractive-element-interactions', 'no-noninteractive-element-to-interactive-role',
  'no-noninteractive-tabindex', 'no-redundant-roles', 'no-static-element-interactions', 'prefer-tag-over-role',
  'role-has-required-aria-props', 'role-supports-aria-props', 'scope', 'tabindex-no-positive',
].map((rule) => `jsx-a11y/${rule}`)

export const presetExpoRouteExports = ['ErrorBoundary', 'unstable_settings', 'generateStaticParams']

export const presetTestFiles = ['**/{test,tests,e2e}/**/*.{ts,tsx,mts,cts}', '**/*.{test,spec}.{ts,tsx,mts,cts}']

export const presetBaseImports = [{ group: ['zod/v4', 'zod/v4/**'], message: 'Import from zod, not its transition entry point.' }]

export const presetDetectFrameworks: ['tanstack' | 'next' | 'expo', string[]][] = [
  ['next', ['next', 'vinext']],
  ['tanstack', ['@tanstack/react-start']],
  ['expo', ['expo']],
]

export const presetDetectDesktop = ['electrobun', 'electron', '@tauri-apps/api', '@tauri-apps/cli']

export const presetDetectBackend = ['@orpc/server', 'hono', 'kysely', 'drizzle-orm', 'express', 'fastify', 'elysia']

export const presetDetectSkip = ['node_modules', 'dist', 'build', 'coverage', 'public', '.output', '.next', '.vinext', '.turbo', '.wrangler', 'target']

export const presetStylesheetNames = ['styles', 'globals', 'global', 'app', 'index', 'main', 'style', 'tailwind']

export const presetRegistryFiles = ['core/core.services.ts', 'service.ts']

export const presetRegistrySkip = ['brand', 'database', 'db', 'math', 'security', 'tools']

export const presetServerEntries = ['rpc', 'server', 'security', 'services']

export const presetOperationImports = ['*/*-action.*', '*/*-query.*', '*/actions/*', '*/queries/*']

export const presetKitImports = ['**/kits', '**/kits/index', '**/kits/index.ts']

export const presetKitFiles = '^(?:kit|[a-z0-9]+(?:-[a-z0-9]+)*\\.kit)\\.ts$'

export const presetCliFiles = '^cli(?:-[a-z0-9]+)*(?:\\.[a-z0-9-]+)*\\.tsx?$'

export const presetMigrationFiles = '^(?:\\d{3,14}[-_][a-z0-9]+(?:[-_][a-z0-9]+)*|index)\\.ts$'

export const presetMigrationNumber = '^(\\d{3,14})[-_]'

export const presetRootImports = { 'framer-motion': 'Use motion/react.' }

export const presetPackageImports = { '../../apps/**': 'Packages stay app-agnostic; do not import app internals.' }
