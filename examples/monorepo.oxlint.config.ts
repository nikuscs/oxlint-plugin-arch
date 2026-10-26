import { externals, preset, recipes, templates } from 'oxlint-plugin-arch/preset'

export default preset({
  root: import.meta.dirname,
  folders: {
    ...templates.monorepo,
    '.': {
      layout: { suffixes: ['prompts', 'driver'] },
      tests: { assertions: ['arch.**.to*'] },
      deny: { imports: { 'framer-motion': 'Use motion/react.' } },
    },
    'apps/web': {
      ...recipes.tanstack,
      layout: { services: 'flat' },
      externals: { packages: [...externals, 'ai'] },
    },
    'apps/web/src/routes/handlers': { deny: { imports: { '@acme/server/client': 'Handlers call services directly.' } } },
    'apps/server': {
      ...recipes.backend,
      layout: { strict: true },
      backend: {
        exports: ['@acme/server/client'],
        registry: { file: 'apps/server/src/core/core.services.ts', skip: ['database'] },
      },
      orpc: { public: ['apps/server/src/rpc/api/**'], composers: ['paginatedOutput'] },
    },
    'apps/server/src/services': { deny: { imports: { '#/core/core.services': 'Services never import the registry.' } } },
    'apps/server/src/services/database/migrations': {
      layout: false,
      naming: { files: '^\\d{3}-[a-z0-9-]+\\.ts$', unique: '^(\\d{3})-' },
    },
    'apps/server/tests': { deny: { imports: { '**/kits': 'Import the kit file.' } } },
    'packages/ui': { ...recipes.kit, tailwind: { css: 'apps/web/src/application/styles.css' } },
  },
})
