import { presetExternals } from '../preset.constants.ts'
import { presetOverride } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const externalsGroup: PresetBuilder<'externals'> = () => [
  presetOverride(['**/{vite,next}.config.{ts,mts,cts,js,mjs,cjs}'], { 'arch/files-externals': ['error', { packages: presetExternals }] }),
]
