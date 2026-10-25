import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { presetExtensions, presetGeneratedFiles } from './preset.constants.ts'
import type * as PresetTypes from '../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

export class PresetError extends Error {}

export function presetScopes(roots: string[], suffix = `**/${presetExtensions}`): string[] {
  return roots.map((root) => (root === '.' ? suffix : `${root}/${suffix}`))
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

export function presetRuntime(
  project: PresetTypes.PresetProject,
  settings: Required<PresetTypes.PresetFrameworkOptions>,
  files: string[],
  rule: string,
): OxlintOverride {
  const options: PresetTypes.PresetRuntimeOptions = {
    web: project.web.map((path) => resolve(project.root, path)),
    backend: project.backend.map((path) => resolve(project.root, path)),
    aliases: project.aliases,
    backendPackages: project.units.flatMap((unit) => (unit.kind === 'backend' ? [presetPackageName(project.root, unit.key) ?? []].flat() : [])),
    serverImports: settings.server,
    clientImports: settings.client,
    allowComputedImportsIn: settings.dynamic.map((path) => resolve(project.root, path)),
  }

  if (rule === 'arch/boundaries-tanstack') {
    options.rpcClients = project.rpcClients.map((path) => resolve(project.root, path))
  }

  return presetOverride([...presetScopes(files, 'services/**/*.{ts,tsx}'), ...presetScopes(files, 'lib/**/*.{ts,tsx}')], {
    [rule]: ['error', options],
  })
}
