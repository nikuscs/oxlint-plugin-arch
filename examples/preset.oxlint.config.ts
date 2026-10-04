import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset'

export default preset({
  root: import.meta.dirname,
  architecture: {
    'apps/web': { role: 'web', layout: { services: 'domain' } },
    'apps/server': { role: 'server', layout: { services: 'domain' } },
    scripts: 'scripts',
    packages: 'packages',
  },
  maxLines: 400,
  banTypes: (current) =>
    current.map((scope) => ({
      ...scope,
      excludeFiles: [...(scope.excludeFiles ?? []), '**/portable/**'],
    })),
})
