import { defineConfig } from 'oxlint'

const restrictedImportPatterns = [
  {
    group: ['@/types/types.*'],
    message: 'Import from "@/types" (index.ts) instead of individual type files.',
  },
]

const testRestrictedImportPatterns = [
  {
    group: ['**/helpers/**'],
    message: 'Do not import from tests/helpers. Use make, kit, scenarios, or tests/support instead.',
  },
]

const boundaryPatterns = [
  {
    regex: '#/?services/.+\\.(service|utils)',
    allowTypeImports: true,
    message: 'Boundary files (*.types.ts, *.constants.ts) must not runtime-import implementation files. Use import type instead.',
  },
  {
    regex: '#/?services/.+/(actions|queries)/',
    allowTypeImports: true,
    message: 'Boundary files (*.types.ts, *.constants.ts) must not runtime-import implementation files. Use import type instead.',
  },
  {
    regex: '#/?core/',
    allowTypeImports: true,
    message: 'Boundary files (*.types.ts, *.constants.ts) must not runtime-import from core. Use import type instead.',
  },
]

const roleFiles = [
  '**/apps/{server,web}/src/**/*.{constants,utils,handler,service,types}.ts',
  '**/apps/{server,web}/src/**/*-{constants,utils,handler,service,types}.ts',
]

const componentFiles = ['**/apps/web/src/components/**/*.tsx']

const componentExceptions = [
  '**/*.test.tsx',
  '**/apps/web/src/components/ui/**',
  '**/*-context.tsx',
  '**/context-*.tsx',
]

const factoryHelpers = {
  allowPattern: '^(create|make)[A-Z]',
  detectComponents: false,
}

export default defineConfig({
  plugins: ['typescript', 'react', 'import', 'unicorn', 'promise', 'vitest', 'node', 'oxc'],
  jsPlugins: [
    { name: 'arch', specifier: 'oxlint-plugin-arch' },
  ],
  rules: {
    'no-restricted-imports': ['error', { patterns: restrictedImportPatterns }],
    'arch/prefer-namespace-type-import': ['error', { max: 3 }],
    'arch/no-literal-in': 'error',
    'arch/no-promise-all-mutation': 'error',
    'arch/padding-between-statements': 'error',
    'arch/object-multiline': 'error',
    'arch/key-value-same-line': 'error',
    'arch/call-array-multiline': 'error',
    'arch/chain-newline': ['error', {
      groups: [
        { minDepth: 3, methods: ['selectFrom', 'selectAll', 'insertInto', 'updateTable', 'deleteFrom', 'execute'] },
        { minDepth: 2, rootPattern: 'Procedure$' },
        { minDepth: 2, onlyMethods: ['input', 'handler', 'use', 'output'] },
        { minDepth: 3, methods: ['map', 'filter', 'reduce', 'flatMap', 'find', 'some', 'every', 'sort'] },
      ],
    }],
  },
  overrides: [
    {
      files: ['**/apps/{server,web}/src/**/*.types.ts'],
      excludeFiles: ['**/apps/{server,web}/src/types/**'],
      rules: {
        'arch/no-restricted-files': ['error', { message: 'App type modules must live under the app src/types directory.' }],
      },
    },
    {
      files: roleFiles,
      rules: {
        'arch/export-file-prefix': ['error', {
          stem: 'before-first-dot',
          trailingRoles: ['constants', 'utils', 'handler', 'service', 'types'],
          roleSeparators: ['.', '-'],
          normalize: 'remove-separators',
          allowPattern: '^(make[A-Z]|\\*$)',
        }],
      },
    },
    {
      files: ['**/*.constants.ts'],
      rules: {
        'arch/only-export-constants': ['error', { allowTypeExports: true }],
      },
    },
    {
      files: ['**/*.types.ts', '**/*.constants.ts'],
      rules: {
        'no-restricted-imports': ['error', { patterns: [...restrictedImportPatterns, ...boundaryPatterns] }],
      },
    },
    {
      files: ['**/apps/{server,web}/src/**/*.{ts,tsx}'],
      excludeFiles: ['**/apps/server/src/types/**'],
      rules: {
        'arch/no-local-schema-construction': ['warn', {
          packages: ['zod'],
          namespaces: ['z'],
          message: 'Schemas belong in apps/server/src/types; import a named backend schema instead.',
        }],
      },
    },
    {
      files: ['**/apps/server/src/**'],
      rules: {
        'no-console': 'error',
        'typescript/no-explicit-any': 'error',
      },
    },
    {
      files: ['**/apps/server/src/types/**/*.types.ts'],
      rules: {
        'arch/no-top-level-functions': ['error', { banReExports: false }],
        'arch/declaration-name': ['error', {
          kinds: ['type', 'interface'],
          singularize: 'trailing-s',
          trailingRoles: ['types'],
        }],
      },
    },
    {
      files: ['**/apps/server/src/services/**/*.ts'],
      rules: {
        'arch/no-inline-types': 'error',
        'arch/no-type-declarations': ['error', { allowPattern: 'Service$' }],
        'arch/no-module-mutable-state': 'error',
        'arch/no-restricted-constructor': ['error', {
          constructors: ['Error'],
          message: 'Throw a typed domain error instead.',
        }],
        'arch/no-unescaped-like': ['error', {
          methods: ['like', 'ilike'],
          operatorMethods: ['where'],
          sanitizers: ['escapeLikeWildcards'],
          allowSanitizedBindings: true,
        }],
      },
    },
    {
      files: ['**/apps/server/src/services/**/*.service.ts'],
      rules: {
        'arch/no-extra-exports': ['error', {
          names: ['make{Domain}Service', '{Domain}Service', '{domain}ServiceDefinition', 'default'],
          domainStem: 'before-first-dot',
          allowTypeExports: false,
        }],
      },
    },
    {
      files: ['**/apps/server/src/services/**/actions/*.ts'],
      rules: {
        'arch/filename-match': ['error', {
          pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*-action\\.[a-z0-9]+(?:[-.][a-z0-9]+)*\\.ts$',
          message: 'Action files must match {domain}-action.{verb}.ts.',
        }],
        'arch/filename-export-name': ['error', {
          file: '{domain}-action.{name}.ts',
          export: 'make{Domain}Action{Name}',
          placeholderPattern: '[a-z0-9-]+',
        }],
        'arch/require-file-factory': ['error', { factory: 'make{Stem}' }],
        'arch/require-object-params': 'error',
        'arch/no-extra-factory-keys': ['error', {
          keys: ['run'],
          requireKeys: ['run'],
          factoryPattern: '^make[A-Z]',
        }],
        'arch/no-file-level-helpers': ['error', factoryHelpers],
      },
    },
    {
      files: ['**/apps/server/src/services/**/queries/*.ts'],
      rules: {
        'arch/filename-match': ['error', {
          pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*-query-[a-z0-9]+(?:-[a-z0-9]+)*\\.ts$',
          message: 'Query files must match {domain}-query-{name}.ts.',
        }],
        'arch/filename-export-name': ['error', {
          file: '{domain}-query-{name}.ts',
          export: 'make{Domain}Query{Name}',
          placeholderPattern: '[a-z0-9-]+',
          mode: 'some',
        }],
        'arch/require-file-factory': ['error', { factory: 'make{Stem}' }],
        'arch/require-object-params': 'error',
        'arch/no-extra-factory-keys': ['error', {
          keys: ['get', 'list', 'find', 'search', 'count', 'summary', 'detail'],
          factoryPattern: '^make[A-Z]',
        }],
        'arch/no-file-level-helpers': ['error', factoryHelpers],
        'arch/no-restricted-token': ['error', {
          restrictions: [
            { member: '*.insertInto', message: 'Queries are read-only; move writes to an action.' },
            { member: '*.updateTable', message: 'Queries are read-only; move writes to an action.' },
            { member: '*.deleteFrom', message: 'Queries are read-only; move writes to an action.' },
          ],
        }],
      },
    },
    {
      files: ['**/apps/server/src/rpc/api/**/*.ts'],
      rules: {
        'arch/require-orpc-output': ['error', {
          composers: ['paginationOutput'],
          handlerMethod: 'handler',
          outputMethod: 'output',
        }],
      },
    },
    {
      files: ['**/apps/server/src/rpc/**/*.ts'],
      rules: {
        'arch/no-restricted-token': ['error', {
          restrictions: [
            { member: '*.selectFrom', message: 'RPC handlers call services, not the database.' },
            { member: '*.insertInto', message: 'RPC handlers call services, not the database.' },
          ],
        }],
      },
    },
    {
      files: ['**/apps/server/src/services/database/migrations/*.ts'],
      rules: {
        'arch/filename-match': ['error', {
          pattern: '^\\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\\.ts$',
          message: 'Migration files must use a 3-digit prefix and kebab-case name.',
        }],
      },
    },
    {
      files: ['**/apps/server/tests/**'],
      rules: {
        'no-restricted-imports': ['error', { patterns: [...restrictedImportPatterns, ...testRestrictedImportPatterns] }],
        'arch/no-module-mutable-state': ['error', { kinds: ['let'] }],
      },
    },
    {
      files: ['**/test/**', '**/tests/**', '**/*.test.{ts,tsx}', '**/*.spec.ts'],
      rules: {
        'arch/test-title-pattern': ['error', { forbid: '^should\\b', flags: 'i' }],
      },
    },
    {
      files: ['**/apps/web/src/**'],
      rules: {
        'arch/require-paired-call': ['error', { when: 'useForm', require: 'standardSchemaResolver' }],
        'arch/no-restricted-token': ['error', {
          token: 'RouterClient',
          allowIn: ['/apps/web/src/services/rpc.client.ts'],
        }],
        'arch/no-rederive-schema': ['error', {
          from: ['@app/server/client'],
          namespaces: ['z'],
          operators: ['infer', 'input'],
        }],
      },
    },
    {
      files: ['**/apps/web/src/types/**/*.types.ts'],
      rules: {
        'arch/no-imported-type-alias': 'error',
        'arch/no-runtime-in-types': ['error', { banReExports: true }],
      },
    },
    {
      files: ['**/apps/web/src/services/*.{ts,tsx}'],
      excludeFiles: [
        '**/apps/web/src/services/*.client.{ts,tsx}',
        '**/apps/web/src/services/*.rsc.{ts,tsx}',
        '**/apps/web/src/services/*.server.{ts,tsx}',
      ],
      rules: {
        'arch/no-restricted-files': ['error', { message: 'Web service files must use a .client, .rsc or .server suffix.' }],
      },
    },
    {
      files: ['**/apps/web/src/services/*.{client,server}.{ts,tsx}'],
      rules: {
        'arch/export-file-prefix': 'error',
      },
    },
    {
      files: ['**/apps/web/src/services/*.rsc.{ts,tsx}'],
      rules: {
        'arch/export-file-prefix': 'error',
        'arch/export-name-pattern': ['error', { pattern: '^[a-z][a-z0-9]*Rsc[A-Z][a-zA-Z0-9]*$' }],
      },
    },
    {
      files: componentFiles,
      excludeFiles: componentExceptions,
      rules: {
        'arch/only-export-components': ['error', { matchFileName: true, denyTypePattern: 'Props$' }],
        'arch/folder-prefix': ['error', { singularize: 'trailing-s', separators: ['-'] }],
        'arch/no-file-level-helpers': ['error', {
          allowPattern: '^(create|make)[A-Z]',
          detectComponents: true,
          hookPattern: '^use[A-Z]',
        }],
      },
    },
    {
      files: ['**/apps/web/src/routes/**/*.tsx'],
      rules: {
        'arch/route-surface': ['error', {
          exportName: 'Route',
          bannedHooks: ['useState', 'useEffect', 'useMutation'],
          banIntrinsicJsx: true,
        }],
      },
    },
    {
      files: ['**/apps/web/src/routes/handlers/**'],
      rules: {
        'arch/no-file-level-helpers': ['error', { detectComponents: false }],
      },
    },
  ],
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.output',
    '.tanstack',
    '.vite',
    '**/routes.tree.ts',
    '**/*.generated.ts',
    '**/paraglide/**',
  ],
})
