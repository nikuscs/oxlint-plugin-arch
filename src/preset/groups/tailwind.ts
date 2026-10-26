import { presetTailwindRules } from '../preset.constants.ts'
import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const tailwindGroup: PresetBuilder<'tailwind'> = (project) =>
  Object.entries(project.css).map(([path, entryPoint]) =>
    presetOverride(
      presetScopes([path]),
      Object.fromEntries(
        Object.entries(presetTailwindRules).map(([rule, severity]) => [
          rule,
          rule === 'tailwindcss/no-duplicate-classes' || rule === 'tailwindcss/no-unnecessary-whitespace' ? severity : [severity, { entryPoint }],
        ]),
      ),
    ),
  )
