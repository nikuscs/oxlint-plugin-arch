import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset'

export default preset({
  root: import.meta.dirname,
  architecture: {
    'apps/web': 'web',
    'apps/server': 'server',
    scripts: 'scripts',
    packages: 'packages',
  },
  banTypes: (current) =>
    current.map((scope) => ({
      ...scope,
      excludeFiles: [...(scope.excludeFiles ?? []), '**/portable/**'],
    })),
})
