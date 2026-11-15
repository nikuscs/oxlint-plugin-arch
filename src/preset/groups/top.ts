import { presetExtensions } from '../preset.constants.ts'
import { presetOverride } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const topGroup: PresetBuilder<'top'> = (_project, { level: _level, allow, ...rest }) => {
  if (allow === undefined && rest.deny === undefined) {
    return []
  }

  const listed = allow === undefined || allow.includes('import') ? allow : ['import', ...allow]
  const options = Object.fromEntries(Object.entries({ allow: listed, ...rest }).filter(([, value]) => value !== undefined))

  return [presetOverride([`**/${presetExtensions}`], { 'arch/files-top-level': ['error', options] })]
}
