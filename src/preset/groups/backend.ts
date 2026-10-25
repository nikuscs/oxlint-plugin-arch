import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const backendGroup: PresetBuilder<'backend'> = (project) => [
  presetOverride(presetScopes(project.backend, 'rpc/**/*.ts'), {
    'arch/boundaries-rpc-database': 'error',
    'no-restricted-imports': ['error', { paths: ['kysely'], patterns: project.baseImports }],
  }),
]
