import { existsSync, globSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { posix, resolve } from 'node:path'
import { presetExtensions, presetGeneratedFiles, presetLayoutFileName, presetLiteralSegment } from './preset.constants.ts'
import type * as PresetTypes from '../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

export class PresetError extends Error {}

async function presetEffectImport<T>(load: Promise<T>): Promise<T | null> {
  try {
    return await load
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ERR_MODULE_NOT_FOUND') {
      return null
    }

    throw error
  }
}

const presetEffectTsgo = await presetEffectImport(import('@effect/tsgo/oxlint-presets'))
const presetEffectLinteffect = await presetEffectImport(import('@opsydyn/oxlint-effect'))
const presetEffectRegexp = await presetEffectImport(import('eslint-plugin-regexp'))
const presetEffectDeMorgan = await presetEffectImport(import('eslint-plugin-de-morgan'))
const presetRequire = createRequire(import.meta.url)

function presetResolve(name: string): string | undefined {
  try {
    return presetRequire.resolve(name)
  } catch {
    return undefined
  }
}

export function presetEffectStyle(): PresetTypes.PresetEffectStyle {
  const sonarjs = presetResolve('eslint-plugin-sonarjs')
  const regexp = presetEffectRegexp ? presetResolve('eslint-plugin-regexp') : undefined
  const deMorgan = presetEffectDeMorgan ? presetResolve('eslint-plugin-de-morgan') : undefined

  const rules: PresetTypes.PresetRules = { ...presetEffectRegexp?.configs['flat/recommended'].rules, ...presetEffectDeMorgan?.configs.recommended.rules }

  if (sonarjs) {
    rules['sonarjs/super-linear-regex'] = 'error'
  }

  return {
    rules,
    jsPlugins: [
      ...(regexp ? [{ name: 'regexp', specifier: regexp }] : []),
      ...(deMorgan ? [{ name: 'de-morgan', specifier: deMorgan }] : []),
      ...(sonarjs ? [{ name: 'sonarjs', specifier: sonarjs }] : []),
    ],
  }
}

export function presetEffectPackages(): PresetTypes.PresetEffectPackages {
  if (!presetEffectTsgo || !presetEffectLinteffect) {
    throw new PresetError('The effect group needs @effect/tsgo and @opsydyn/oxlint-effect: bun add -d @effect/tsgo @opsydyn/oxlint-effect')
  }

  return { tsgo: presetEffectTsgo, linteffect: presetEffectLinteffect }
}

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

export function presetGlobEscape(path: string): string {
  return path.replaceAll(/[[\]]/g, (bracket) => `[${bracket}]`)
}

export function presetFileOverlaps(
  root: string,
  build: (pattern: string, folder: PresetTypes.PresetFolder) => PresetTypes.PresetFileKey,
  keys: PresetTypes.PresetFileKey[],
): PresetTypes.PresetFileKey[] {
  const matched = new Map<string, PresetTypes.PresetFileKey[]>()

  for (const key of keys) {
    for (const path of globSync(key.pattern, { cwd: root, exclude: (name) => posix.basename(name) === 'node_modules' })) {
      matched.set(path, [...(matched.get(path) ?? []), key])
    }
  }

  const reach = new Map(keys.map((key) => [key, [...matched.values()].filter((found) => found.includes(key)).length]))

  const merged = [...matched].flatMap(([path, found]) => {
    if (found.length < 2) {
      return []
    }

    const ordered = found.toSorted((left, right) => (reach.get(right) ?? 0) - (reach.get(left) ?? 0))

    return [build(presetGlobEscape(path), ordered.reduce<PresetTypes.PresetFolder>((folder, key) => Object(presetMerge(folder, key.folder)), {}))]
  })

  return [...keys, ...merged]
}

export function presetImportTargets(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap(presetImportTargets)
  }

  return value instanceof Object ? Object.values(value).flatMap(presetImportTargets) : []
}

export function presetHarvestAliases(root: string, directories: string[]): Record<string, string> {
  const found = new Map<string, Set<string>>()

  for (const directory of directories) {
    for (const [key, value] of Object.entries(presetManifest(root, directory).imports ?? {})) {
      const alias = /^(#[^*]*)\/\*$/.exec(key)?.[1]
      const target = presetImportTargets(value).find((mapped) => /^\.\/(?:[^*]*\/)?\*$/.test(mapped))

      if (alias && target) {
        found.set(alias, (found.get(alias) ?? new Set()).add(posix.join(directory, target.slice(0, -1)).replace(/\/$/, '') || '.'))
      }
    }
  }

  return Object.fromEntries([...found].flatMap(([alias, paths]) => (paths.size === 1 ? [[alias, [...paths][0]]] : [])))
}

export function presetAliases(project: PresetTypes.PresetProject, aliases: Record<string, string | false> | undefined): Record<string, string> {
  const merged = { ...project.aliases, ...Object.fromEntries(Object.entries(aliases ?? {}).map(([alias, path]) => [alias.replace(/\/$/, ''), path])) }

  return Object.fromEntries(Object.entries(merged).flatMap(([alias, path]) => (path === false ? [] : [[alias, resolve(project.root, path)]])))
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
      aliases: presetAliases(project, unit.scope.effective.imports?.aliases),
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

export function presetSource(root: string, directory: string, configured?: string): string {
  if (configured !== undefined) {
    return posix.join(directory, configured)
  }

  return existsSync(resolve(root, directory, 'src')) ? posix.join(directory, 'src') : directory
}

export function presetFilled(conventions: PresetTypes.PresetFolders, exists: (path: string) => boolean): PresetTypes.PresetFolders {
  return Object.fromEntries(
    Object.entries(conventions).filter(([path, folder]) => {
      const denied = folder instanceof Object && folder.deny instanceof Object ? { ...folder.deny.imports, ...folder.deny.calls } : undefined
      const empty = denied !== undefined && Object.keys(denied).length === 0

      return exists(path) && !empty
    }),
  )
}

function presetMergeObject<T extends object>(base: T, top: T, depth: number): T {
  const merged = { ...base }

  for (const [key, value] of Object.entries(top)) {
    const previous: unknown = Reflect.get(merged, key)
    const nested = previous instanceof Object && value instanceof Object && !Array.isArray(previous) && !Array.isArray(value)

    if (nested && depth > 0) {
      Reflect.set(merged, key, presetMergeObject<object>(previous, value, depth - 1))
    } else if (value !== true || !(previous instanceof Object)) {
      Reflect.set(merged, key, value)
    }
  }

  return merged
}

function presetMergeModule(base: PresetTypes.PresetFolder, top: PresetTypes.PresetFolder): PresetTypes.PresetFolder {
  const before = base.effect instanceof Object ? base.effect.module : undefined
  const after = top.effect instanceof Object ? top.effect.module : undefined

  if (before === undefined || !(after instanceof Object) || !(top.effect instanceof Object)) {
    return top
  }

  return { ...top, effect: { ...top.effect, module: { ...(typeof before === 'string' ? { name: before } : before), ...after } } }
}

export function presetMerge(base: boolean | PresetTypes.PresetFolder | undefined, top: boolean | PresetTypes.PresetFolder): boolean | PresetTypes.PresetFolder {
  if (!(base instanceof Object) || !(top instanceof Object)) {
    return top === true && base instanceof Object ? base : top
  }

  const merged = presetMergeObject(base, presetMergeModule(base, top), 2)
  const before = base.layout instanceof Object ? base.layout.files : undefined
  const after = top.layout instanceof Object ? top.layout.files : undefined
  const owned = [base.deny, top.deny].flatMap((deny) => (deny instanceof Object ? (deny.only ?? []) : []))

  if (owned.length > 0 && merged.deny instanceof Object) {
    merged.deny = { ...merged.deny, only: owned }
  }

  return before && after && merged.layout instanceof Object ? { ...merged, layout: { ...merged.layout, files: [...before, ...after] } } : merged
}

export function presetNames(inherited: string[], entries: unknown, option: string, valid = presetLayoutFileName): string[] {
  if (!Array.isArray(entries) || !entries.every((entry) => typeof entry === 'string' && valid.test(entry))) {
    throw new PresetError(
      valid === presetLayoutFileName
        ? `${option} takes file names such as \`*.prompts.ts\`; \`!*.utils.ts\` removes one.`
        : `${option} takes a list of strings; \`!\` before one removes it.`,
    )
  }

  const names = [...inherited]

  for (const entry of entries) {
    const index = names.indexOf(entry.startsWith('!') ? entry.slice(1) : entry)

    if (entry.startsWith('!') && index !== -1) {
      names.splice(index, 1)
    } else if (!entry.startsWith('!') && index === -1) {
      names.push(entry)
    }
  }

  return names
}

export function presetBraces(key: string): string[] {
  const match = /\{([^{}]*)\}/.exec(key)

  if (!match) {
    return [key]
  }

  return match[1].split(',').flatMap((option) => presetBraces(`${key.slice(0, match.index)}${option}${key.slice(match.index + match[0].length)}`))
}

export function presetTop(allow: PresetTypes.PresetEffectTop): PresetTypes.PresetFolder {
  return { top: { allow, stem: 'folder' } }
}

export function presetPlaces(names: string[]): string {
  const listed = names.map((name) => name.replaceAll(/\{(\w+)\}|\*/g, (_, key: string | undefined) => `<${key ?? 'name'}>`))

  return listed.length === 1 ? listed[0] : `${listed.slice(0, -1).join(', ')} or ${listed.at(-1)}`
}
