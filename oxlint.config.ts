import { preset } from './dist/preset/preset.js'

export default preset({
  root: import.meta.dirname,
  folders: {
    '.': {
      style: { semicolons: false },
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
