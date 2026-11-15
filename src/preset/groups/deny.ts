import { presetExtensions, presetQueryWrites } from '../preset.constants.ts'
import { presetOverride, presetServiceScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

export const denyGroup: PresetBuilder<'deny'> = (project, settings) => {
  const kept = (entries: Record<string, string | false>) =>
    Object.fromEntries(Object.entries(entries).filter((entry): entry is [string, string] => entry[1] !== false))

  const imports = kept(settings.imports)
  const calls = kept(settings.calls)
  const overrides: OxlintOverride[] = []

  const keys = ['only', 'file', 'placeholder', 'stem', 'singularize'] as const
  const only = Object.fromEntries(keys.flatMap((key) => (settings[key] === undefined || (key === 'only' && settings.only.length === 0) ? [] : [[key, settings[key]]])))

  if (Object.keys(imports).length > 0 || Object.keys(calls).length > 0 || settings.only.length > 0) {
    overrides.push(presetOverride([`**/${presetExtensions}`], { 'arch/boundaries-deny': ['error', { imports, calls, ...only }] }))
  }

  const reads = Object.fromEntries(presetQueryWrites.map((name) => [name, 'Query files only read; move writes to an action.']))

  for (const unit of project.units.filter((item) => item.kind === 'backend')) {
    const files = [
      ...presetServiceScopes(project.serviceFolders, [unit.source], '**/*-query.*.ts'),
      ...presetServiceScopes(project.serviceFolders, project.operations.filter((path) => path === unit.source), '*/queries/*.ts'),
    ]

    overrides.push(presetOverride(files, { 'arch/boundaries-deny': ['error', { imports, calls: kept({ ...reads, ...settings.calls }), ...only }] }))
  }

  return overrides
}
