import { presetNextHandlerMethods, presetNextSegmentConfig, presetNextSegmentExports } from '../preset.constants.ts'
import { presetOverride, presetRuntime, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const nextGroup: PresetBuilder<'next'> = (project, settings) => {
  const { nextWeb, testFiles } = project
  const bannedHooks = ['useState', 'useEffect', 'useMutation']
  const page = { exportName: 'default', allowedExports: presetNextSegmentExports, bannedHooks, inspectExports: true }

  return [
    presetOverride(
      presetScopes(nextWeb, 'app/**/{page,template,default,not-found,forbidden,unauthorized,loading}.tsx'),
      { 'arch/files-route': ['error', { ...page, banIntrinsicJsx: true }] },
      [...testFiles, ...presetScopes(nextWeb, 'app/not-found.tsx')],
    ),
    presetOverride(
      [...presetScopes(nextWeb, 'app/**/{layout,global-not-found}.tsx'), ...presetScopes(nextWeb, 'app/not-found.tsx')],
      { 'arch/files-route': ['error', { ...page, banIntrinsicJsx: false }] },
      testFiles,
    ),
    presetOverride(presetScopes(nextWeb, 'app/**/route.ts'), {
      'arch/files-route': [
        'error',
        { exportName: 'GET', allowedExports: [...presetNextHandlerMethods.slice(1), ...presetNextSegmentConfig], bannedHooks: [], banIntrinsicJsx: false },
      ],
      'arch/files-helpers': [
        'error',
        {
          detectComponents: false,
          allowPattern: `^(${[...presetNextHandlerMethods, ...presetNextSegmentConfig].join('|')})$`,
          message: 'Nest this helper in its owning route handler, or move genuine domain logic to a service. Do not create a component, hook or public helper to bypass this rule.',
        },
      ],
    }),
    presetRuntime(project, settings, nextWeb, 'arch/boundaries-next'),
  ]
}
