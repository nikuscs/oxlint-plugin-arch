import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const schemasGroup: PresetBuilder<'schemas'> = (project) => {
  const { backend, nextWeb, packageSources, ui } = project
  const owners = backend.length > 0 ? backend : nextWeb

  return [
    presetOverride(
      project.appFiles,
      { 'arch/schemas-local': ['error', { packages: ['zod'], namespaces: ['z'] }] },
      [...presetScopes([...owners, ...packageSources], 'types/**'), ...project.colocated, ...ui],
    ),
    presetOverride([...project.webFiles, ...presetScopes(packageSources)], {
      'arch/schemas-rederive': ['error', { from: project.publicEntrypoints, namespaces: ['z'], operators: ['infer', 'input'] }],
    }),
  ]
}
