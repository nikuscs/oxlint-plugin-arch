import { existsSync, readdirSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import * as PresetConstants from './preset.constants.ts'
import { PresetError, presetIsDirectory, presetServicesFolder } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'

const presetFrameworks: PresetTypes.PresetFramework[] = ['tanstack', 'next', 'expo']
const presetKindGroups: PresetTypes.PresetKindGroup[] = [...presetFrameworks, 'backend', 'console']

function presetUnitSource(root: string, key: string, kind: PresetTypes.PresetKind, source: string | undefined): string {
  if (source !== undefined) {
    if (source !== '.' && !source.split('/').every((segment) => PresetConstants.presetLiteralSegment.test(segment))) {
      throw new PresetError(`Folder \`${key}\` source must be \`.\` or a literal relative path.`)
    }

    return posix.join(key, source)
  }

  return kind === 'console' || !existsSync(resolve(root, key, 'src')) ? key : posix.join(key, 'src')
}

function presetSets(folder: PresetTypes.PresetFolder, name: PresetTypes.PresetKindGroup): boolean {
  return folder[name] !== undefined && folder[name] !== false
}

function presetKind(key: string, enabled: (name: PresetTypes.PresetKindGroup) => boolean) {
  const frameworks = presetFrameworks.filter(enabled)

  if (frameworks.length > 1) {
    throw new PresetError(`Folder \`${key}\` enables more than one of tanstack, next and expo.`)
  }

  const [framework] = frameworks

  if (frameworks.length > 0 && enabled('backend')) {
    throw new PresetError(`Folder \`${key}\` is either an app (tanstack, next, expo) or a backend, not both.`)
  }

  let kind: PresetTypes.PresetKind = 'library'

  if (frameworks.length > 0) {
    kind = 'web'
  } else if (enabled('backend')) {
    kind = 'backend'
  } else if (enabled('console')) {
    kind = 'console'
  }

  return { kind, framework }
}

function presetHasManifest(root: string, key: string): boolean {
  if (key === '.') {
    return false
  }

  if (!key.endsWith('/*')) {
    return existsSync(resolve(root, key, 'package.json'))
  }

  const base = resolve(root, key.slice(0, -2))

  return presetIsDirectory(base) && readdirSync(base).some((name) => existsSync(resolve(base, name, 'package.json')))
}

function presetUnit(root: string, key: string, scope: PresetTypes.PresetScope): PresetTypes.PresetUnit {
  const { effective } = scope
  const wildcard = scope.parent && scope.parent.depth === scope.depth && scope.parent.key.includes('*') ? scope.parent.folder : {}
  const folder = { ...wildcard, ...scope.folder }
  const own = presetKindGroups.some((name) => presetSets(folder, name)) || presetHasManifest(root, key)
  const { kind, framework } = presetKind(key, (name) => (own ? presetSets(folder, name) : Boolean(effective[name])))
  const layout: Record<string, PresetTypes.PresetLayoutMode> = {}
  const settings = effective.layout

  if (settings) {
    const services = settings.services ?? (kind === 'console' ? false : 'domain')
    const hooks = settings.hooks ?? (kind === 'web' ? 'flat' : false)
    const modes = { services, hooks, components: settings.components ?? false }

    for (const [name, mode] of Object.entries(modes)) {
      if (mode === 'flat' || mode === 'domain') {
        layout[name] = mode
      }
    }
  }

  const source = presetUnitSource(root, key, kind, folder.source)
  const services = presetServicesFolder(root, source, folder.services, kind === 'web' || kind === 'backend')

  return { key, scope, kind, framework, source, services, layout }
}

export function presetUnits(root: string, scopes: PresetTypes.PresetScope[], ignored: Set<string>): PresetTypes.PresetUnit[] {
  const [rootScope] = scopes
  const rootKind = presetKind('.', (name) => Boolean(rootScope.effective[name])).kind
  const candidates: PresetTypes.PresetScope[] = []

  for (const scope of scopes) {
    const manifest = presetHasManifest(root, scope.key)
    const own = presetKindGroups.some((name) => presetSets(scope.folder, name)) || manifest
    const top = scope.parent?.key === '.' && (rootKind === 'library' || own)
    const sibling = scope.parent !== null && candidates.includes(scope.parent) && scope.parent.depth === scope.depth && !scope.key.includes('*')
    const workspace = scope.parent !== null && scope.parent.key !== '.' && manifest

    if (top || sibling || workspace) {
      candidates.push(scope)
    }
  }

  const unitScopes = candidates.filter((scope) => !ignored.has(scope.key))
  const explicit = new Set(unitScopes.map((scope) => scope.key))
  const rootSource = presetUnitSource(root, '.', rootKind, rootScope.folder.source)
  const overlaps = (left: string, right: string) => left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`)
  const rootOwnsSource = rootSource !== '.' && !unitScopes.some((scope) => overlaps(scope.key.replace(/\/\*$/, ''), rootSource))
  const rootUnit = rootKind !== 'library' || rootOwnsSource || unitScopes.every((scope) => presetUnit(root, scope.key, scope).kind === 'console')

  return [...(rootUnit ? [rootScope] : []), ...unitScopes].flatMap((scope) => {
    if (!scope.key.endsWith('/*')) {
      return [presetUnit(root, scope.key, scope)]
    }

    const base = scope.key.slice(0, -2)

    return readdirSync(resolve(root, base))
      .filter((name) => !name.startsWith('.') && presetIsDirectory(resolve(root, base, name)))
      .map((name) => posix.join(base, name))
      .filter((key) => !explicit.has(key) && !ignored.has(key))
      .map((key) => presetUnit(root, key, scope))
  })
}
