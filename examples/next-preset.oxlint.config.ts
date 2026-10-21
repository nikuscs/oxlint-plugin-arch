import { reactModulesPreset } from 'oxlint-plugin-arch/presets'

export default reactModulesPreset({
  root: import.meta.dirname,
  architecture: {
    'apps/site': { role: 'web', framework: 'next', layout: { services: 'domain' } },
    'apps/dashboard': { role: 'web', framework: 'tanstack-start' },
    'apps/server': { role: 'server', layout: { services: 'domain' } },
    scripts: 'scripts',
    packages: 'packages',
  },
  imports: { backendEntryPoints: ['@app/server/client'] },
  next: { additionalServerOnlyImports: ['@app/database'] },
})
