import { readFileSync, statSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { presetExtensions, presetGeneratedFiles, presetLiteralSegment } from './preset.constants.ts'
import type * as PresetTypes from '../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

export class PresetError extends Error {}

export function presetScopes(roots: string[], suffix = `**/${presetExtensions}`): string[] {
  return roots.map((root) => (root === '.' ? suffix : `${root}/${suffix}`))
}

export function presetServiceScopes(folders: Record<string, string>, sources: string[], suffix = `**/${presetExtensions}`): string[] {
  return presetScopes(sources.map((source) => folders[source] ?? posix.join(source, 'services')), suffix)
}

export function presetOverride(files: string[], rules: PresetTypes.PresetRules, excludeFiles: string[] = []): OxlintOverride {
  return {
    files,
    excludeFiles: [...presetGeneratedFiles, ...excludeFiles],
    rules,
  }
}

export function presetSeverity(rules: PresetTypes.PresetRules, level: PresetTypes.PresetLevel): PresetTypes.PresetRules {
  return Object.fromEntries(
    Object.entries(rules).map(([name, value]) => {
      const current = Array.isArray(value) ? value[0] : value

      if (current === 'off' || current === 'allow' || current === 0) {
        return [name, value]
      }

      return [name, Array.isArray(value) ? [level, ...value.slice(1)] : level]
    }),
  )
}

export function presetPackageName(root: string, directory: string): string | undefined {
  try {
    const manifest: PresetTypes.PresetManifest = JSON.parse(readFileSync(resolve(root, directory, 'package.json'), 'utf8'))
    return typeof manifest.name === 'string' ? manifest.name : undefined
  } catch {
    return undefined
  }
}

function presetSegment(pattern: string, segment: string): boolean {
  if (pattern === segment || pattern === '*' || segment === '*') {
    return true
  }

  const source = pattern
    .replaceAll(/[.+^$()|[\]\\]/g, '\\$&')
    .replaceAll('?', '.')
    .replaceAll('*', '[^/]*')
    .replaceAll(/\{([^}]*)\}/g, (_, options: string) => `(?:${options.split(',').join('|')})`)

  return new RegExp(`^${source}$`).test(segment)
}

function presetIntersectSegments(glob: string[], scope: string[]): string[][] {
  if (scope.length === 0) {
    return glob.length > 0 ? [glob] : []
  }

  if (glob.length === 0) {
    return []
  }

  const [head, ...rest] = glob

  if (head === '**') {
    const deeper = scope.map((_, index) =>
      presetIntersectSegments(rest, scope.slice(index)).map((tail) => [...scope.slice(0, index), ...tail]),
    )

    return [[...scope, ...glob], ...deeper.flat()]
  }

  if (!presetSegment(head, scope[0])) {
    return []
  }

  const segment = scope[0] === '*' ? head : scope[0]

  return presetIntersectSegments(rest, scope.slice(1)).map((tail) => [segment, ...tail])
}

export function presetIntersect(glob: string, scope: string): string[] {
  if (scope === '.') {
    return [glob]
  }

  const matches = presetIntersectSegments(glob.split('/'), scope.split('/')).map((segments) => segments.join('/'))

  return [...new Set(matches)]
}

export function presetAliases(root: string, aliases: Record<string, string> | undefined): Record<string, string> {
  return Object.fromEntries(Object.entries(aliases ?? {}).map(([alias, path]) => [alias.replace(/\/$/, ''), resolve(root, path)]))
}

export function presetRuntime(
  project: PresetTypes.PresetProject,
  settings: Required<PresetTypes.PresetFrameworkOptions>,
  framework: PresetTypes.PresetFramework,
  rule: string,
): OxlintOverride[] {
  return project.units.flatMap((unit) => {
    if (unit.framework !== framework) {
      return []
    }

    const options: PresetTypes.PresetRuntimeOptions = {
      web: project.web.map((path) => resolve(project.root, path)),
      backend: project.backend.map((path) => resolve(project.root, path)),
      aliases: presetAliases(project.root, unit.scope.effective.imports?.aliases),
      backendPackages: project.units.flatMap((item) => (item.kind === 'backend' ? (presetPackageName(project.root, item.key) ?? []) : [])),
      server: settings.server,
      client: settings.client,
      dynamic: settings.dynamic.map((path) => resolve(project.root, path)),
    }

    if (rule === 'arch/boundaries-tanstack') {
      options.rpc = project.rpcClients.map((path) => resolve(project.root, path))
    }

    return [
      presetOverride([...presetServiceScopes(project.serviceFolders, [unit.source], '**/*.{ts,tsx}'), ...presetScopes([unit.source], 'lib/**/*.{ts,tsx}')], {
        [rule]: ['error', options],
      }),
    ]
  })
}

export function presetManifest(root: string, directory: string): PresetTypes.PresetManifest {
  try {
    return JSON.parse(readFileSync(resolve(root, directory, 'package.json'), 'utf8'))
  } catch {
    return {}
  }
}

export function presetIsDirectory(path: string): boolean {
  try {
    return statSync(path, { throwIfNoEntry: false })?.isDirectory() ?? false
  } catch {
    return false
  }
}

export function presetServicesFolder(root: string, source: string, configured?: string, fallback = true): string {
  if (configured !== undefined) {
    if (!configured.split('/').every((segment) => presetLiteralSegment.test(segment))) {
      throw new PresetError(`services \`${configured}\` must be a literal relative path.`)
    }

    return posix.join(source, configured)
  }

  const lib = fallback && !presetIsDirectory(resolve(root, source, 'services')) && presetIsDirectory(resolve(root, source, 'lib'))

  return posix.join(source, lib ? 'lib' : 'services')
}

export function presetIsFile(path: string): boolean {
  try {
    return statSync(path, { throwIfNoEntry: false })?.isFile() ?? false
  } catch {
    return false
  }
}
