import type { PresetFolders, PresetRecipe } from '../types/preset.types.ts'

const presetUi = { react: true, kit: true, tailwind: true }

export const presetRecipes = {
  tanstack: { react: true, tanstack: true, tailwind: true, shadcn: true, schemas: true, forms: true },
  next: { react: true, next: true, tailwind: true, shadcn: true, schemas: true, forms: true },
  expo: { react: true, expo: true, schemas: true, forms: true },
  backend: { backend: true, schemas: true, sql: true, layout: { strict: true } },
  react: { react: true, tailwind: true, schemas: true },
  desktop: { console: true },
  library: { schemas: true },
  ui: presetUi,
  kit: presetUi,
  cli: { console: true },
} satisfies Record<string, PresetRecipe>

export const presetTemplates = {
  monorepo: {
    'apps/web': presetRecipes.tanstack,
    'apps/server': presetRecipes.backend,
    'packages/*': presetRecipes.library,
    scripts: presetRecipes.cli,
  },
} satisfies Record<string, PresetFolders>
