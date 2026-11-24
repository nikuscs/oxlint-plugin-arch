import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const limitsGroup: PresetBuilder<'limits'> = (project, settings, scope) => {
  const own = scope.folder.limits instanceof Object ? scope.folder.limits : {}
  const fileKey = project.fileKeys.some((key) => key.scopes.includes(scope))
  const types = fileKey && own.lines !== undefined && own.types === undefined ? settings.lines : settings.types

  return [
    presetOverride(
      project.safetyFiles,
      {
        'max-lines': ['error', { max: settings.lines, skipBlankLines: true, skipComments: true }],
        complexity: ['error', { max: settings.complexity }],
      },
      project.ui,
    ),
    presetOverride(
      [...presetScopes(project.app, '**/*.types.ts'), ...presetScopes(project.app, '**/*.schemas.ts')],
      { 'max-lines': ['error', { max: types, skipBlankLines: true, skipComments: true }] },
      project.ui,
    ),
  ]
}
