import { presetTanstackRsc } from '../preset.constants.ts'
import { presetOverride, presetRouteName, presetRuntime, presetScopes, presetServiceScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const tanstackGroup: PresetBuilder<'tanstack'> = (project, settings) => {
  const { tanstackWeb, testFiles } = project
  const ignored = [...presetScopes(tanstackWeb, 'routes/**/-*'), ...presetScopes(tanstackWeb, 'routes/**/-*/**')]
  const tokens = presetScopes(tanstackWeb, 'routes/**/{route,*.route,*.lazy}.tsx')

  return [
    presetOverride(presetScopes(tanstackWeb, 'routes/**/*.tsx'), presetRouteName('**/routes/{path}.tsx', 'Route', 'functions'), [...testFiles, ...ignored, ...tokens]),
    presetOverride(presetScopes(tanstackWeb, 'routes/**/route.tsx'), presetRouteName('**/routes/{path}/route.tsx', 'Route', 'functions'), [...testFiles, ...ignored]),
    presetOverride(presetScopes(tanstackWeb, 'routes/**/*.route.tsx'), presetRouteName('**/routes/{path}.route.tsx', 'Route', 'functions'), [...testFiles, ...ignored]),
    presetOverride(presetScopes(tanstackWeb, 'routes/**/*.lazy.tsx'), presetRouteName('**/routes/{path}.lazy.tsx', 'Route', 'functions'), [...testFiles, ...ignored]),
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
            paths: [presetTanstackRsc],
            patterns: project.baseImports,
          },
        ],
      },
      presetServiceScopes(project.serviceFolders, tanstackWeb, '**/*.rsc.{ts,tsx}'),
    ),
    ...presetRuntime(project, settings, 'tanstack', 'arch/boundaries-tanstack'),
  ]
}
