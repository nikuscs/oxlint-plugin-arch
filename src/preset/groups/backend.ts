import { posix, resolve } from 'node:path'
import { presetRegistryFile } from '../preset-detect.ts'
import { presetRegistrySkip } from '../preset.constants.ts'
import { PresetError, presetOverride, presetScopes } from '../preset.utils.ts'
import type { BackendRegistryOptions } from '../../types/backend.types.ts'
import type { PresetBuilder, PresetRegistryOptions } from '../../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

export const backendGroup: PresetBuilder<'backend'> = (project, settings) => {
  const overrides: OxlintOverride[] = [
    presetOverride(presetScopes(project.backend, '{rpc,routes}/**/*.ts'), {
      'arch/boundaries-rpc-database': 'error',
      'no-restricted-imports': ['error', { paths: ['kysely', 'drizzle-orm'], patterns: project.baseImports }],
    }),
    presetOverride(presetScopes(project.backend), {
      'eslint-js/no-restricted-syntax': ['error', { selector: ':function > Identifier.params[name="trx"]', message: 'Name the transaction db so helpers take either.' }],
    }),
  ]

  if (settings.registry === false) {
    return overrides
  }

  const configured: PresetRegistryOptions = typeof settings.registry === 'string' ? { file: settings.registry } : (settings.registry ?? {})
  const backendUnits = project.units.filter((unit) => unit.kind === 'backend')

  const file = configured.file === undefined ? undefined : posix.normalize(configured.file)

  const registries = file === undefined
    ? backendUnits.flatMap((unit) => {
      const found = presetRegistryFile(project.root, unit.source, undefined, unit.services)

      return found ? [{ file: found, unit }] : []
    })
    : [{ file, unit: backendUnits.find((unit) => unit.key === '.' || file.startsWith(`${unit.key}/`)) }]

  for (const registry of registries) {
    if (!registry.unit) {
      throw new PresetError(`backend.registry \`${registry.file}\` must be a project-relative path inside a backend folder.`)
    }

    const options: BackendRegistryOptions = {
      registry: resolve(project.root, registry.file),
      services: resolve(project.root, registry.unit.services),
      skip: configured.skip ?? (file === undefined ? presetRegistrySkip : []),
    }

    if (configured.object !== undefined) {
      options.object = configured.object
    }

    overrides.push(presetOverride([registry.file], { 'arch/backend-registry': ['error', options] }))
  }

  return overrides
}
