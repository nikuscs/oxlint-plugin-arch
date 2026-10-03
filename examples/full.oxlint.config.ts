import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [
    { name: 'arch', specifier: '../src/index.ts' },
  ],
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        'arch/prefer-namespace-type-import': ['error', { max: 3, names: { './shared.types': 'SharedTypes' } }],
        'arch/no-member-comments': ['error', { allowWhy: true }],
        'arch/no-literal-in': ['error', { allow: ['serviceWorker'] }],
        'arch/no-promise-all-mutation': ['error', {
          combinators: ['Promise.all', 'Promise.allSettled'],
          methods: ['push', 'unshift', 'splice', 'set', 'add'],
          checkAssignments: true,
        }],
        'arch/padding-between-statements': ['error', { returnMinStatements: 3, multilineVariables: true }],
        'arch/key-value-same-line': 'error',
        'arch/object-multiline': ['error', { minProperties: 3, scope: 'call-args', indent: 2 }],
        'arch/call-array-multiline': ['error', {
          callees: ['Promise.all', 'Promise.allSettled'],
          minElements: 2,
        }],
        'arch/chain-newline': ['error', {
          groups: [
            { minDepth: 3, methods: ['selectFrom', 'insertInto', 'updateTable', 'deleteFrom'] },
            { minDepth: 2, rootPattern: 'Procedure$' },
            { minDepth: 3, methods: ['map', 'filter', 'reduce'] },
          ],
        }],
      },
    },
    {
      files: ['**/*.{test,spec}.{ts,tsx}'],
      rules: {
        'arch/test-title-pattern': ['error', {
          callees: ['describe', 'it', 'test'],
          forbid: '^should\\b',
          flags: 'i',
        }],
      },
    },
    {
      files: ['**/src/**/*.ts'],
      rules: {
        'arch/no-restricted-token': ['error', {
          restrictions: [
            { token: 'InternalClient', allowIn: ['/src/client.ts'] },
            { member: 'process.platform', allowIn: ['/src/runtime.ts'] },
            { member: '*.insertInto', allowPathPatterns: ['/src/actions/'], message: 'Only actions write.' },
          ],
        }],
        'arch/require-paired-call': ['error', {
          pairs: [{ when: 'createForm', require: 'schemaResolver' }],
        }],
        'arch/no-trivial-functions': ['error', {
          allowPattern: '^(create|make)[A-Z]',
          allowCallees: ['^http\\.'],
        }],
        'arch/no-module-mutable-state': ['error', { allowNamePattern: 'Cache$' }],
      },
    },
    {
      files: ['**/src/data/**/*.ts'],
      rules: {
        'arch/no-top-level-functions': ['error', { banReExports: true }],
      },
    },
    {
      files: ['**/src/types/**/*.ts'],
      rules: {
        'arch/no-runtime-in-types': ['error', {
          runtimeImports: 'ban',
          allowImportSources: ['^zod$'],
          banReExports: true,
        }],
        'arch/no-imported-type-alias': 'error',
        'arch/declaration-name': ['error', {
          kinds: ['type', 'interface', 'enum'],
          singularize: 'trailing-s',
          trailingRoles: ['types'],
        }],
      },
    },
    {
      files: ['**/*.tsx'],
      rules: {
        'arch/jsx-attributes-multiline': ['error', { minAttributes: 3 }],
        'arch/no-local-schema-construction': ['warn', {
          packages: ['zod'],
          namespaces: ['z'],
          allowIn: ['/src/forms/legacy-form.tsx'],
          allowPathPatterns: ['/src/components/'],
          message: 'Move this schema to a types file or the server module that owns it.',
        }],
      },
    },
    {
      files: ['**/src/components/**/*.tsx'],
      rules: {
        'arch/only-export-components': ['error', { matchFileName: true, denyTypePattern: 'Props$' }],
        'arch/no-extra-exports': ['error', {
          names: ['{Domain}'],
          patterns: ['{Domain}[A-Z]\\w*'],
          domainStem: 'full-basename',
        }],
        'arch/folder-prefix': ['error', {
          singularize: 'trailing-s',
          separators: ['-'],
          after: 'components',
        }],
        'arch/export-file-prefix': ['error', {
          stem: 'full-basename',
          normalize: 'remove-separators',
          singularize: 'trailing-s',
          allDeclarations: true,
        }],
        'arch/no-file-level-helpers': ['error', {
          detectComponents: true,
          hookPattern: '^use[A-Z]',
          allowPattern: '^(create|make)[A-Z]',
        }],
      },
    },
    {
      files: ['**/src/hooks/**/*.tsx'],
      rules: {
        'arch/no-restricted-files': ['error', {
          message: 'Hooks must use .ts files.',
        }],
      },
    },
    {
      files: ['**/src/actions/*.ts'],
      rules: {
        'arch/filename-match': ['error', {
          pattern: '^[a-z0-9-]+-action\\.[a-z0-9.-]+\\.ts$',
          message: 'Action filenames must include their domain and action name.',
        }],
        'arch/filename-export-name': ['error', {
          file: '{domain}-action.{name}.ts',
          export: 'make{Domain}Action{Name}',
          mode: 'all',
        }],
        'arch/require-file-factory': ['error', {
          factory: 'make{Stem}',
        }],
        'arch/require-object-params': ['error', { maxParams: 2 }],
        'arch/no-extra-factory-keys': ['error', {
          keys: ['run'],
          factoryPattern: '^make[A-Z]',
          requireKeys: ['run'],
        }],
      },
    },
    {
      files: ['**/src/**/*.constants.ts'],
      rules: {
        'arch/only-export-constants': ['error', {
          allowFunctionValues: false,
          allowTypeExports: false,
          allowReExports: false,
        }],
      },
    },
    {
      files: ['**/src/services/*.ts'],
      rules: {
        'arch/no-inline-types': ['error', {
          parameters: true,
          returns: true,
          functionTypes: true,
          minMembers: 2,
        }],
        'arch/no-restricted-constructor': ['error', {
          constructors: ['Error'],
          message: 'Throw a domain error instead.',
        }],
        'arch/no-comments': ['error', { allowWhy: true }],
        'arch/export-file-prefix': ['error', {
          stem: 'before-first-dot',
          normalize: 'remove-separators',
          trailingRoles: ['utils'],
        }],
        'arch/no-extra-exports': ['error', {
          names: ['make{Domain}Service', '{Domain}Service', 'default'],
          domainStem: 'before-first-dot',
          trailingRoles: ['utils'],
          allowTypeExports: true,
        }],
      },
    },
    {
      files: ['**/src/server/*.ts'],
      rules: {
        'arch/export-name-pattern': ['error', {
          pattern: '^[a-z][a-zA-Z0-9]*Server[A-Z][a-zA-Z0-9]*$',
          ignoreTypeExports: true,
        }],
      },
    },
    {
      files: ['**/src/routes/**/*.tsx'],
      rules: {
        'arch/route-surface': ['error', {
          exportName: 'Route',
          bannedHooks: ['useState', 'useEffect', 'useMutation'],
          banIntrinsicJsx: true,
        }],
      },
    },
    {
      files: ['**/src/api/**/*.ts'],
      rules: {
        'arch/require-orpc-output': ['error', {
          composers: ['paginatedOutput'],
          handlerMethod: 'handler',
          outputMethod: 'output',
        }],
        'arch/declaration-name': ['error', {
          kinds: ['const', 'function'],
          singularize: 'trailing-s',
        }],
        'arch/no-type-declarations': ['error', {
          allowPattern: 'ErrorKind$',
        }],
      },
    },
    {
      files: ['**/src/schemas/**/*.ts'],
      rules: {
        'arch/no-inline-schema-elements': ['error', {
          namespaces: ['z'],
          methods: ['array', 'union', 'record', 'tuple'],
          structuralMethods: ['array', 'object', 'record', 'tuple', 'union'],
          allowZodScalars: true,
        }],
        'arch/no-rederive-schema': ['error', {
          from: ['@company/contracts'],
          namespaces: ['z'],
          operators: ['infer', 'input'],
        }],
        'arch/no-single-use-scalar-schema': ['error', {
          namespaces: ['z'],
          methods: ['array', 'union', 'record', 'tuple'],
          structuralMethods: ['and', 'array', 'object', 'or', 'pipe', 'record', 'transform', 'tuple', 'union'],
          allowZodScalars: true,
        }],
      },
    },
    {
      files: ['**/src/database/**/*.ts'],
      rules: {
        'arch/no-unescaped-like': ['error', {
          methods: ['like', 'ilike'],
          operatorMethods: ['where'],
          sanitizers: ['escapeLikeWildcards'],
          allowSanitizedBindings: true,
        }],
      },
    },
  ],
})
