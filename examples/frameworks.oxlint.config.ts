import { preset, recipes } from 'oxlint-plugin-arch/preset'

export default preset({
  root: import.meta.dirname,
  folders: {
    'apps/app': recipes.tanstack,
    'apps/site': { ...recipes.next, next: { server: ['pg'] } },
    'apps/mobile': { ...recipes.expo, tailwind: true },
    'apps/api': recipes.backend,
    'packages/*': recipes.library,
  },
})
