import { presetOverride } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const orpcGroup: PresetBuilder<'orpc'> = (project) =>
  project.orpc.public.length > 0
    ? [
      presetOverride(project.orpc.public, {
        'arch/backend-orpc-output': ['error', { handler: 'handler', output: 'output', composers: project.orpc.composers }],
      }),
    ]
    : []
