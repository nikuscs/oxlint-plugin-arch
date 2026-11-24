import { resolve } from 'node:path'
import { presetExtensions, presetImportRules } from '../preset.constants.ts'
import { presetAliases, presetOverride, presetPackageName, presetScopes } from '../preset.utils.ts'
import type * as PresetTypes from '../../types/preset.types.ts'

function importsPackageNames(project: PresetTypes.PresetProject, kinds: PresetTypes.PresetKind[]): string[] {
  return project.units.flatMap((unit) => {
    const name = kinds.includes(unit.kind) ? presetPackageName(project.root, unit.key) : undefined

    return name ? [name] : []
  })
}

export const importsGroup: PresetTypes.PresetBuilder<'imports'> = (project, settings) => {
  const rules: PresetTypes.PresetRules = {
    ...presetImportRules,
    'arch/types-namespace-import': ['error', { max: 3 }],
    'no-restricted-imports': ['error', { patterns: project.baseImports }],
    'import-extra/no-relative-packages': 'error',
    'perfectionist/sort-imports': [
      'error',
      {
        type: 'natural',
        ignoreCase: true,
        newlinesBetween: 0,
        environment: 'bun',
        internalPattern: settings.internal ?? [
          '^@/.*',
          '^#.*',
          '^~icons/.*',
          ...project.publicEntrypoints.map((path) => `^${path.split('/').slice(0, 2).join('/')}/`),
        ],
        groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index'], 'type'],
      },
    ],
  }

  if (!settings.sort) {
    delete rules['perfectionist/sort-imports']
    delete rules['perfectionist/sort-named-imports']
  }

  const overrides = [presetOverride([`**/${presetExtensions}`], rules)]

  if (!settings.boundaries) {
    return overrides
  }

  const absolute = (paths: string[]) => paths.map((path) => resolve(project.root, path))

  const options = {
    web: absolute(project.web),
    backend: absolute(project.backend),
    packages: absolute(project.packages),
    roles: project.fileKinds,
    services: absolute([...project.web, ...project.backend].map((source) => project.serviceFolders[source])),
    portable: true,
    aliases: presetAliases(project, settings.aliases),
    appPackages: importsPackageNames(project, ['web', 'backend']),
    backendPackages: importsPackageNames(project, ['backend']),
    entrypoints: project.publicEntrypoints,
  }

  const files = [...project.appFiles, ...presetScopes(project.packages, `**/${presetExtensions}`)]

  overrides.push(presetOverride(files, { 'arch/boundaries-imports': ['error', options] }))

  for (const unit of project.units.filter((item) => item.key !== '.' && Object.keys(project.aliases[item.key] ?? {}).length > 0)) {
    overrides.push(presetOverride(files.filter((glob) => glob.startsWith(`${unit.key}/`)), {
      'arch/boundaries-imports': ['error', { ...options, aliases: presetAliases(project, settings.aliases, unit.key) }],
    }))
  }

  return overrides
}
