import { presetOverride, presetRuntime, presetScopes, presetServiceScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const tanstackGroup: PresetBuilder<'tanstack'> = (project, settings) => {
  const { tanstackWeb, testFiles } = project

  return [
    presetOverride(
      presetScopes(tanstackWeb, 'routes/**/*.{ts,tsx}'),
      { 'arch/files-route': ['error', { export: 'Route', hooks: ['useState', 'useEffect', 'useMutation'], intrinsic: true }] },
      testFiles,
    ),
    presetOverride(presetScopes(tanstackWeb, 'routes/handlers/**/*.ts'), {
      'arch/files-helpers': [
        'error',
        {
          components: false,
          message: 'Nest this helper in its owning route handler callback, or move genuine domain logic to a service. Do not create a component, hook or public helper to bypass this rule.',
        },
      ],
    }),
    presetOverride(
      presetScopes(tanstackWeb),
      {
        'no-restricted-imports': [
          'error',
          {
            paths: [{ name: '@tanstack/react-start/rsc', message: 'Render server components only in services/*.rsc.tsx files.' }],
            patterns: project.baseImports,
          },
        ],
      },
      presetServiceScopes(project.serviceFolders, tanstackWeb, '**/*.rsc.{ts,tsx}'),
    ),
    ...presetRuntime(project, settings, 'tanstack', 'arch/boundaries-tanstack'),
  ]
}
