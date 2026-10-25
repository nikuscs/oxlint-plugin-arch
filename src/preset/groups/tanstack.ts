import { presetOverride, presetRuntime, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const tanstackGroup: PresetBuilder<'tanstack'> = (project, settings) => {
  const { tanstackWeb, testFiles } = project

  return [
    presetOverride(
      presetScopes(tanstackWeb, 'routes/**/*.{ts,tsx}'),
      { 'arch/files-route': ['error', { exportName: 'Route', bannedHooks: ['useState', 'useEffect', 'useMutation'], banIntrinsicJsx: true }] },
      testFiles,
    ),
    presetOverride(presetScopes(tanstackWeb, 'routes/handlers/**/*.ts'), {
      'arch/files-helpers': [
        'error',
        {
          detectComponents: false,
          message: 'Nest this helper in its owning route handler callback, or move genuine domain logic to a service. Do not create a component, hook or public helper to bypass this rule.',
        },
      ],
    }),
    presetRuntime(project, settings, tanstackWeb, 'arch/boundaries-tanstack'),
  ]
}
