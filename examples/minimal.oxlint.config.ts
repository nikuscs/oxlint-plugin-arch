import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [
    { name: 'arch', specifier: '../src/index.ts' },
  ],
  overrides: [
    {
      files: ['**/src/**/*.ts'],
      rules: {
        'arch/filename-match': ['error', {
          pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*\\.ts$',
          message: 'Source filenames must use kebab-case.',
        }],
      },
    },
    {
      files: ['**/src/**/*.types.ts'],
      rules: {
        'arch/no-runtime-in-types': 'error',
      },
    },
    {
      files: ['**/src/hooks/**/*.tsx'],
      rules: {
        'arch/no-restricted-files': ['error', {
          message: 'Hooks must use .ts files because they do not render JSX.',
        }],
      },
    },
  ],
})
