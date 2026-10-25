import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: [
    { name: 'arch', specifier: 'oxlint-plugin-arch' },
    { name: 'dillon-anti-slop', specifier: 'oxlint-plugin-arch/dillon-anti-slop' },
  ],
  rules: {
    'arch/layout-object': ['error', { minProperties: 3 }],
    'arch/files-types-only': ['error', { runtimeImports: 'ban' }],
    'dillon-anti-slop/no-reflect-get': 'error',
  },
})
