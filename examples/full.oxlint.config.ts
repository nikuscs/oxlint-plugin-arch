import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [
    { name: 'arch', specifier: '../src/index.ts' },
  ],
  overrides: [
    {
      files: ['**/src/**/*.ts'],
      rules: {
        'arch/no-restricted-token': ['error', {
          token: 'InternalClient',
          allowIn: ['/src/client.ts'],
        }],
        'arch/require-paired-call': ['error', {
          when: 'createForm',
          require: 'schemaResolver',
        }],
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
        'arch/no-runtime-in-types': 'error',
        'arch/no-imported-type-alias': 'error',
      },
    },
    {
      files: ['**/*.tsx'],
      rules: {
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
        'arch/only-export-components': ['error', { matchFileName: true }],
        'arch/folder-prefix': ['error', {
          singularize: 'trailing-s',
          separators: ['-'],
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
        'arch/require-object-params': 'error',
        'arch/no-extra-factory-keys': ['error', {
          keys: ['run'],
          factoryPattern: '^make[A-Z]',
        }],
      },
    },
    {
      files: ['**/src/services/*.ts'],
      rules: {
        'arch/export-file-prefix': ['error', {
          stem: 'before-first-dot',
          normalize: 'remove-separators',
        }],
        'arch/no-extra-exports': ['error', {
          names: ['make{Domain}Service', '{Domain}Service', 'default'],
          domainStem: 'before-first-dot',
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
          sanitizers: ['escapeLikeWildcards'],
          allowSanitizedBindings: true,
        }],
      },
    },
  ],
})
