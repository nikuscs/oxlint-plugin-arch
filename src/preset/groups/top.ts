import { presetExtensions } from '../preset.constants.ts'
import { presetOverride } from '../preset.utils.ts'
import type { FilesTopLevelOptions } from '../../types/files.types.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const topGroup: PresetBuilder<'top'> = (_project, { allow, deny, message }) => {
  if (allow === undefined && deny === undefined) {
    return []
  }

  const options: FilesTopLevelOptions = {}

  if (allow !== undefined) {
    options.allow = allow.includes('import') ? allow : ['import', ...allow]
  }

  if (deny !== undefined) {
    options.deny = deny
  }

  if (message !== undefined) {
    options.message = message
  }

  return [presetOverride([`**/${presetExtensions}`], { 'arch/files-top-level': ['error', options] })]
}
