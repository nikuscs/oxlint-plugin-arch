import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset'

export default preset({
  root: import.meta.dirname,
  architecture: {
    'apps/web': { role: 'web', layout: { services: 'domain' } },
    'apps/server': { role: 'server', layout: { services: 'domain' } },
    scripts: 'scripts',
    packages: 'packages',
  },
  limits: { maxFileLines: 400 },
  policies: {
    typePlacement: (current) =>
      current.map((scope) => ({
        ...scope,
        excludeFiles: [...(scope.excludeFiles ?? []), '**/portable/**'],
      })),
  },
})
