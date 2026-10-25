import { preset, recipes, templates } from 'oxlint-plugin-arch/preset'

export default preset({
  root: import.meta.dirname,
  folders: {
    ...templates.monorepo,
    '.': {
      layout: { suffixes: ['prompts', 'driver'] },
      tests: { assertions: ['arch.**.to*'] },
    },
    'apps/web': { ...recipes.tanstack, layout: { services: 'flat' } },
    'apps/server': {
      ...recipes.backend,
      backend: { exports: ['@acme/server/client'] },
      orpc: { public: ['apps/server/src/rpc/api/**'], composers: ['paginatedOutput'] },
    },
    'apps/server/src/services/database/migrations': { layout: false },
    'packages/ui': { ...recipes.kit, tailwind: { css: 'apps/web/src/application/styles.css' } },
  },
})
