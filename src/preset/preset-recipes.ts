import type { PresetFolders, PresetRecipe } from '../types/preset.types.ts'

export const presetRecipes = {
  tanstack: { react: true, tanstack: true, tailwind: true, shadcn: true, schemas: true, forms: true },
  next: { react: true, next: true, tailwind: true, shadcn: true, schemas: true, forms: true },
  expo: { react: true, expo: true, schemas: true, forms: true },
  backend: { backend: true, schemas: true, sql: true },
  library: { schemas: true },
  kit: { react: true, kit: true, tailwind: true },
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
