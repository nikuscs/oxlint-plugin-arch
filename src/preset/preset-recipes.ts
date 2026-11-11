import { presetEffectImports, presetRecipeMark } from './preset.constants.ts'
import type { PresetFolders, PresetRecipe } from '../types/preset.types.ts'

const presetUi = { react: true, kit: true, tailwind: true }

function presetRecipe<T extends PresetRecipe>(name: string, recipe: T): T {
  return { ...recipe, [presetRecipeMark]: name }
}

export const presetRecipes = {
  tanstack: presetRecipe('tanstack', {
    react: true,
    tanstack: true,
    tailwind: true,
    shadcn: true,
    schemas: true,
    forms: true,
  }),
  next: presetRecipe('next', {
    react: true,
    next: true,
    tailwind: true,
    shadcn: true,
    schemas: true,
    forms: true,
  }),
  expo: presetRecipe('expo', {
    react: true,
    expo: true,
    schemas: true,
    forms: true,
  }),
  backend: presetRecipe('backend', {
    backend: true,
    schemas: true,
    sql: true,
    orpc: true,
    layout: { strict: true },
  }),
  react: presetRecipe('react', {
    react: true,
    tailwind: true,
    schemas: true,
  }),
  desktop: presetRecipe('desktop', { console: true }),
  library: presetRecipe('library', { schemas: true }),
  effect: presetRecipe('effect', {
    schemas: true,
    effect: true,
    deny: { imports: presetEffectImports },
  }),
  ui: presetRecipe('ui', { ...presetUi }),
  kit: presetRecipe('kit', { ...presetUi }),
  cli: presetRecipe('cli', { console: true }),
} satisfies Record<string, PresetRecipe>

export const presetTemplates = {
  monorepo: {
    'apps/web': presetRecipes.tanstack,
    'apps/server': presetRecipes.backend,
    'packages/*': presetRecipes.library,
    scripts: presetRecipes.cli,
  },
} satisfies Record<string, PresetFolders>
