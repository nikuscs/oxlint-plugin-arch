import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const sqlGroup: PresetBuilder<'sql'> = (project, settings) => [
  presetOverride(presetScopes(project.serviceRoots, 'services/**/*.ts'), {
    'arch/backend-sql-like': [
      'error',
      { methods: ['like', 'ilike'], operatorMethods: ['where'], sanitizers: settings.sanitizers, allowSanitizedBindings: true },
    ],
  }),
]
