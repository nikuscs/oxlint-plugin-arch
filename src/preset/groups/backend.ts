import { posix, resolve } from 'node:path'
import { PresetError, presetOverride, presetScopes } from '../preset.utils.ts'
import type { BackendRegistryOptions } from '../../types/backend.types.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

export const backendGroup: PresetBuilder<'backend'> = (project, settings) => {
  const overrides: OxlintOverride[] = [
    presetOverride(presetScopes(project.backend, 'rpc/**/*.ts'), {
      'arch/boundaries-rpc-database': 'error',
      'no-restricted-imports': ['error', { paths: ['kysely'], patterns: project.baseImports }],
    }),
  ]

  if (settings.registry === undefined) {
    return overrides
  }

  const { file, skip = [], object } = typeof settings.registry === 'string' ? { file: settings.registry } : settings.registry
  const registry = posix.normalize(file)
  const unit = project.units.find((candidate) => candidate.kind === 'backend' && (candidate.key === '.' || registry.startsWith(`${candidate.key}/`)))

  if (!unit) {
    throw new PresetError(`backend.registry \`${file}\` must be a project-relative path inside a backend folder.`)
  }

  const options: BackendRegistryOptions = { registry: resolve(project.root, registry), services: resolve(project.root, unit.source, 'services'), skip }

  if (object !== undefined) {
    options.object = object
  }

  overrides.push(presetOverride([registry], { 'arch/backend-registry': ['error', options] }))

  return overrides
}
