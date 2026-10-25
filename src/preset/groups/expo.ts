import { presetExpoRouteExports } from '../preset.constants.ts'
import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

export const expoGroup: PresetBuilder<'expo'> = (project, settings) => {
  const { expoWeb, testFiles } = project
  const server = settings.server

  const overrides: OxlintOverride[] = [
    presetOverride(
      presetScopes(expoWeb, 'app/**/*.tsx'),
      {
        'arch/files-route': [
          'error',
          { exportName: 'default', allowedExports: presetExpoRouteExports, bannedHooks: ['useState', 'useEffect', 'useMutation'], banIntrinsicJsx: false },
        ],
      },
      testFiles,
    ),
    presetOverride(presetScopes(expoWeb, 'app/**/*+api.ts'), {
      'arch/files-route': ['error', { exportName: 'GET', allowedExports: ['HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], bannedHooks: [], banIntrinsicJsx: false }],
    }),
  ]

  if (server.length > 0) {
    overrides.push(
      presetOverride(presetScopes(expoWeb), {
        'no-restricted-imports': ['error', { paths: server, patterns: project.baseImports }],
      }),
    )
  }

  return overrides
}
