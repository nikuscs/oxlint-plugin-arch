import { presetOverride, presetServiceScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const sqlGroup: PresetBuilder<'sql'> = (project) => [
  presetOverride(presetServiceScopes(project.serviceFolders, project.serviceRoots, '**/*.ts'), { 'arch/backend-sql-like': 'error' }),
]
