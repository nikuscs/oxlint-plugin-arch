import { presetExtensions } from '../preset.constants.ts'
import { presetOverride, presetServiceScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

export const denyGroup: PresetBuilder<'deny'> = (project, settings) => {
  const { imports, calls } = settings
  const overrides: OxlintOverride[] = []

  if (Object.keys(imports).length > 0 || Object.keys(calls).length > 0) {
    overrides.push(presetOverride([`**/${presetExtensions}`], { 'arch/boundaries-deny': ['error', { imports, calls }] }))
  }

  for (const unit of project.units) {
    const writes = unit.kind === 'backend' ? (unit.scope.effective.backend?.writes ?? []) : []

    if (writes.length === 0) {
      continue
    }

    const files = [
      ...presetServiceScopes(project.serviceFolders, [unit.source], '**/*-query.*.ts'),
      ...presetServiceScopes(project.serviceFolders, project.operations.filter((path) => path === unit.source), '*/queries/*.ts'),
    ]

    const reads = Object.fromEntries(writes.map((name) => [name, 'Query files only read; move writes to an action.']))

    overrides.push(presetOverride(files, { 'arch/boundaries-deny': ['error', { imports, calls: { ...reads, ...calls } }] }))
  }

  return overrides
}
