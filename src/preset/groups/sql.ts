import { presetOverride, presetServiceScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const sqlGroup: PresetBuilder<'sql'> = (project, settings) => [
  presetOverride(presetServiceScopes(project.serviceFolders, project.serviceRoots, '**/*.ts'), {
    'arch/backend-sql-like': [
      'error',
      { methods: ['like', 'ilike'], operators: ['where'], sanitizers: settings.sanitizers, bindings: true },
    ],
  }),
]
