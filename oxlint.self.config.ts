import { tanstackStartReactModulesPreset } from './dist/preset/preset.js'

const astInspection = [
  'dillon-anti-slop/no-runtime-typeof',
  'dillon-anti-slop/no-reflect-get',
  'dillon-anti-slop/no-unknown-parameters',
  'arch/types-unknown',
  'arch/code-literal-in',
]

export default tanstackStartReactModulesPreset({
  root: import.meta.dirname,
  architecture: { '.': 'packages' },
  formatting: { semi: 'never', quotes: 'single' },
  ignorePatterns: ['dist/**'],
  ruleExclusions: Object.fromEntries(astInspection.map((rule) => [rule, ['src/**']])),
})
