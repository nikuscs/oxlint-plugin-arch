import { preset } from './dist/preset/preset.js'

const config = preset({
  root: import.meta.dirname,
  folders: {
    '.': {
      style: { semicolons: false },
      tests: { assertions: ['testerRun'] },
      rules: {
        'dillon-anti-slop/no-runtime-typeof': 'off',
        'dillon-anti-slop/no-reflect-get': 'off',
        'dillon-anti-slop/no-unknown-parameters': 'off',
        'arch/types-unknown': 'off',
        'arch/code-literal-in': 'off',
      },
    },
    scripts: { console: true },
    dist: false,
  },
})

config.overrides.push({
  files: ['src/**/*.test.ts'],
  rules: { 'max-lines': ['error', { max: 600, skipBlankLines: true, skipComments: true }] },
})

export default config
