import { presetOverride, presetServiceScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const basicsGroup: PresetBuilder<'basics'> = (project, settings) => {
  const trivial = { mode: 'precise', async: false, callees: [] }
  const { appFiles, safetyFiles, ui, web } = project

  return [
    ...(settings.trivial
      ? [
        presetOverride(appFiles, { 'arch/code-trivial-functions': ['error', trivial] }, ui),
        presetOverride(
          [...presetServiceScopes(project.serviceFolders, web, '**/*.{client,server,rsc}.ts'), ...presetServiceScopes(project.serviceFolders, web, '**/*.rsc.tsx')],
          { 'arch/code-trivial-functions': ['error', { ...trivial, services: true }] },
          ui,
        ),
      ]
      : []),
    ...(settings.state ? [presetOverride(safetyFiles, { 'arch/code-mutable-state': ['error', { kinds: ['let', 'var'] }] }, ui)] : []),
    ...(settings.switch
      ? [presetOverride(project.backendFiles, { 'arch/code-switch': ['error', { message: 'Use ts-pattern in backend application code.' }] })]
      : []),
    ...(settings.negation ? [presetOverride(safetyFiles, { 'arch/code-double-negation': 'error' }, ui)] : []),
  ]
}
