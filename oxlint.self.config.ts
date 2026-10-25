import preset from './dist/presets/tanstack-start-react-modules-preset.js'

export default preset({
  root: import.meta.dirname,
  architecture: { '.': 'packages' },
  formatting: { semi: 'never', quotes: 'single' },
  ignorePatterns: ['dist/**'],
})
