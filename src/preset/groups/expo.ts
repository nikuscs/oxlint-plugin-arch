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
          { export: 'default', exports: presetExpoRouteExports, hooks: ['useState', 'useEffect', 'useMutation'], intrinsic: false },
        ],
      },
      testFiles,
    ),
    presetOverride(
      presetScopes(expoWeb, 'app/**/*.tsx'),
      {
        'arch/naming-file': [
          'error',
          {
            pattern: '^(?:_layout|index|\\[(?:[.]{3})?[\\w.]+\\]|[+][a-z][\\w-]*|[a-z][a-z0-9-]*)(?:[.](?:web|native|ios|android))?[.]tsx$',
            message: 'Expo Router files are kebab-case, _layout, index, [param], [...rest] or +special.',
          },
        ],
        'arch/files-helpers': [
          'error',
          {
            allow: '^makeStyles$',
            message: 'Route files hold screens and their components; move logic to a service or hook.',
          },
        ],
      },
      testFiles,
    ),
    presetOverride(presetScopes(expoWeb), { 'svg-jsx/camel-case-colon': 'off', 'svg-jsx/no-style-string': 'off' }),
    presetOverride(presetScopes(expoWeb, 'app/**/*+api.ts'), {
      'arch/files-route': ['error', { export: 'GET', exports: ['HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], hooks: [], intrinsic: false }],
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
