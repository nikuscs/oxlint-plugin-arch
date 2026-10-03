import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import {
  presetScopes,
  presetOverride,
  presetPackageName,
} from '../utils/helpers/preset.ts'
import { presetExtensions } from '../constants/preset.constants.ts'
import { resolve } from 'node:path'

export function presetBoundariesConfig(context: PresetContext): PresetPolicies {
  const {
    options,
    root,
    architecture,
    web,
    backend,
    appFiles,
    publicEntrypoints,
    baseImports,
  } = context
  const policies: PresetPolicies = {}
  policies.boundaries = [
    presetOverride(
      [
        ...appFiles,
        ...(architecture.packages
          ? [architecture.packages + '/**/' + presetExtensions]
          : []),
      ],
      {
        'modules/import-boundaries': [
          'error',
          {
            web: web.map((path) => resolve(root, path)),
            backend: backend.map((path) => resolve(root, path)),
            packages: architecture.packages
              ? resolve(root, architecture.packages)
              : '',
            aliases: Object.fromEntries(
              Object.entries(options.aliases ?? {}).map(([alias, path]) => [
                alias.replace(/\/$/, ''),
                resolve(root, path),
              ]),
            ),
            appPackages: [
              architecture.web,
              architecture.server,
              architecture.runner,
            ].flatMap((directory) => {
              const name = directory
                ? presetPackageName(root, directory)
                : undefined
              return name ? [name] : []
            }),
            backendPackages: [architecture.server, architecture.runner].flatMap(
              (directory) => {
                const name = directory
                  ? presetPackageName(root, directory)
                  : undefined
                return name ? [name] : []
              },
            ),
            publicEntrypoints,
          },
        ],
      },
    ),
    presetOverride(presetScopes(backend, 'rpc/**/*.ts'), {
      'modules/rpc-database': 'error',
      'no-restricted-imports': [
        'error',
        { paths: ['kysely'], patterns: baseImports },
      ],
    }),
  ]
  return policies
}
