import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [
    { name: 'arch', specifier: '../dist/index.js' },
  ],
  overrides: [
    {
      files: ['**/src/**/*.types.ts'],
      rules: {
        'arch/no-runtime-in-types': 'error',
      },
    },
  ],
})
