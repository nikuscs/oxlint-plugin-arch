import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import { presetScopes, presetOverride, presetPackageName } from '../utils/helpers/preset.ts'
import { presetExtensions } from '../constants/preset.constants.ts'
import { resolve } from 'node:path'

export function presetBoundariesConfig(context: PresetContext): PresetPolicies {
  const { options, root, architecture, packages, web, tanstackWeb, nextWeb, backend, appFiles, publicEntrypoints, baseImports } = context
  const runtimeBoundary = {
    web: web.map((path) => resolve(root, path)),
    backend: backend.map((path) => resolve(root, path)),
    aliases: Object.fromEntries(
      Object.entries(options.imports?.aliases ?? {}).map(([alias, path]) => [alias.replace(/\/$/, ''), resolve(root, path)]),
    ),
    backendPackages: Object.entries(architecture).flatMap(([directory, { role }]) => {
      const name = role === 'server' || role === 'runner' ? presetPackageName(root, directory) : undefined
      return name ? [name] : []
    }),
  }
  const policies: PresetPolicies = {}
  policies.boundaries = [
    presetOverride([...appFiles, ...presetScopes(packages, '**/' + presetExtensions)], {
      'modules/import-boundaries': [
        'error',
        {
          web: web.map((path) => resolve(root, path)),
          backend: backend.map((path) => resolve(root, path)),
          packages: packages.map((path) => resolve(root, path)),
          fileRoles: options.modules?.customFileRoles ?? [],
          portableLib: true,
          aliases: Object.fromEntries(
            Object.entries(options.imports?.aliases ?? {}).map(([alias, path]) => [
              alias.replace(/\/$/, ''),
              resolve(root, path),
            ]),
          ),
          appPackages: Object.entries(architecture).flatMap(([directory, { role }]) => {
            const name =
              role === 'web' || role === 'server' || role === 'runner' ? presetPackageName(root, directory) : undefined
            return name ? [name] : []
          }),
          backendPackages: Object.entries(architecture).flatMap(([directory, { role }]) => {
            const name = role === 'server' || role === 'runner' ? presetPackageName(root, directory) : undefined
            return name ? [name] : []
          }),
          publicEntrypoints,
        },
      ],
    }),
    presetOverride([...presetScopes(tanstackWeb, 'services/**/*.{ts,tsx}'), ...presetScopes(tanstackWeb, 'lib/**/*.{ts,tsx}')], {
      'modules/tanstack-runtime': [
        'error',
        {
          ...runtimeBoundary,
          rpcClients: (options.orpc?.clientOwnerFile ? [options.orpc?.clientOwnerFile] : context.rpcClients).map(
            (path) => resolve(root, path),
          ),
          serverImports: options.tanstackStart?.additionalServerOnlyImports ?? [],
          clientImports: options.tanstackStart?.additionalClientOnlyImports ?? [],
          allowComputedImportsIn:
            options.tanstackStart?.computedImportAllowedFiles?.map((path) => resolve(root, path)) ?? [],
        },
      ],
    }),
    presetOverride([...presetScopes(nextWeb, 'services/**/*.{ts,tsx}'), ...presetScopes(nextWeb, 'lib/**/*.{ts,tsx}')], {
      'modules/next-runtime': [
        'error',
        {
          ...runtimeBoundary,
          serverImports: options.next?.additionalServerOnlyImports ?? [],
          clientImports: options.next?.additionalClientOnlyImports ?? [],
          allowComputedImportsIn: options.next?.computedImportAllowedFiles?.map((path) => resolve(root, path)) ?? [],
        },
      ],
    }),
    presetOverride(presetScopes(backend, 'rpc/**/*.ts'), {
      'modules/rpc-database': 'error',
      'no-restricted-imports': ['error', { paths: ['kysely'], patterns: baseImports }],
    }),
  ]
  return policies
}
