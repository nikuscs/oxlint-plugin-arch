import { presetOverride } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const formsGroup: PresetBuilder<'forms'> = (project) => [
  presetOverride(project.reactFiles, { 'arch/code-paired-call': ['error', { when: 'useForm', require: 'standardSchemaResolver' }] }, project.ui),
]
