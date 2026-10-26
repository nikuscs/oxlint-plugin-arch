import { presetOverride } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const formsGroup: PresetBuilder<'forms'> = (project, settings) => [
  presetOverride(project.reactFiles, { 'arch/code-paired-call': ['error', { when: 'useForm', require: settings.resolver }] }, project.ui),
]
