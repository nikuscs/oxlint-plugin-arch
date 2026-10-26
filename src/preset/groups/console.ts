import { presetExtensions } from '../preset.constants.ts'
import { presetOverride } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const consoleGroup: PresetBuilder<'console'> = () => [presetOverride([`**/${presetExtensions}`], { 'no-console': 'error' })]
