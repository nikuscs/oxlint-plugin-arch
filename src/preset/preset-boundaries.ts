import { resolve } from 'node:path'
import { presetExtensions } from './preset.constants.ts'
import { presetOverride, presetPackageName, presetScopes } from './preset.utils.ts'
import type { PresetContext, PresetPolicies, PresetRole } from '../types/preset.types.ts'

function presetPackageNames({ root, architecture }: PresetContext, roles: PresetRole[]): string[] {
  return Object.entries(architecture).flatMap(([directory, { role }]) => {
    const name = roles.includes(role) ? presetPackageName(root, directory) : undefined
    return name ? [name] : []
  })
}

function presetRuntimeScopes(roots: string[]): string[] {
  return [...presetScopes(roots, 'services/**/*.{ts,tsx}'), ...presetScopes(roots, 'lib/**/*.{ts,tsx}')]
}

export function presetBoundariesConfig(context: PresetContext): PresetPolicies {
  const { options, root, packages, web, tanstackWeb, nextWeb, backend, appFiles, publicEntrypoints, baseImports } =
    context

  const absolute = (paths: string[]) => paths.map((path) => resolve(root, path))

  const aliases = Object.fromEntries(
    Object.entries(options.imports?.aliases ?? {}).map(([alias, path]) => [alias.replace(/\/$/, ''), resolve(root, path)]),
  )

  const backendPackages = presetPackageNames(context, ['server', 'runner'])
  const runtimeBoundary = { web: absolute(web), backend: absolute(backend), aliases, backendPackages }
  return {
    boundaries: [
      presetOverride([...appFiles, ...presetScopes(packages, `**/${presetExtensions}`)], {
        'arch/boundaries-imports': [
          'error',
          {
            web: absolute(web),
            backend: absolute(backend),
            packages: absolute(packages),
            fileRoles: options.modules?.customFileRoles ?? [],
            portableLib: true,
            aliases,
            appPackages: presetPackageNames(context, ['web', 'server', 'runner']),
            backendPackages,
            publicEntrypoints,
          },
        ],
      }),
      presetOverride(presetRuntimeScopes(tanstackWeb), {
        'arch/boundaries-tanstack': [
          'error',
          {
            ...runtimeBoundary,
            rpcClients: absolute(context.rpcClients),
            serverImports: options.tanstackStart?.additionalServerOnlyImports ?? [],
            clientImports: options.tanstackStart?.additionalClientOnlyImports ?? [],
            allowComputedImportsIn: absolute(options.tanstackStart?.computedImportAllowedFiles ?? []),
          },
        ],
      }),
      presetOverride(presetRuntimeScopes(nextWeb), {
        'arch/boundaries-next': [
          'error',
          {
            ...runtimeBoundary,
            serverImports: options.next?.additionalServerOnlyImports ?? [],
            clientImports: options.next?.additionalClientOnlyImports ?? [],
            allowComputedImportsIn: absolute(options.next?.computedImportAllowedFiles ?? []),
          },
        ],
      }),
      presetOverride(presetScopes(backend, 'rpc/**/*.ts'), {
        'arch/boundaries-rpc-database': 'error',
        'no-restricted-imports': ['error', { paths: ['kysely'], patterns: baseImports }],
      }),
    ],
  }
}
