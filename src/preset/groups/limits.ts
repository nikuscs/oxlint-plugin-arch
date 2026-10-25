import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const limitsGroup: PresetBuilder<'limits'> = (project, settings) => [
  presetOverride(
    project.safetyFiles,
    {
      'max-lines': ['error', { max: settings.lines, skipBlankLines: true, skipComments: true }],
      complexity: ['error', { max: settings.complexity }],
    },
    project.ui,
  ),
  presetOverride(
    presetScopes(project.app, '**/*.types.ts'),
    { 'max-lines': ['error', { max: settings.types, skipBlankLines: true, skipComments: true }] },
    project.ui,
  ),
]
