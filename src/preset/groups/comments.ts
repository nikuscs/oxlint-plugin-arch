import { presetExtensions } from '../preset.constants.ts'
import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const commentsGroup: PresetBuilder<'comments'> = (project, settings) => [
  presetOverride(project.appFiles, { 'arch/comments-code': ['error', { why: false, allow: ['^\\s*SAFETY: '] }] }, project.ui),
  presetOverride(presetScopes(project.app, '**/*.{types,constants}.ts'), { 'arch/comments-code': ['error', { why: false }] }),
  ...(settings.directives ? [presetOverride([`**/${presetExtensions}`], { 'arch/comments-directives': 'error' })] : []),
]
