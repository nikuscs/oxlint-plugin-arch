import { existsSync, readdirSync, statSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import * as PresetConstants from './preset.constants.ts'
import { PresetError, presetPackageName, presetScopes } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'

const presetFrameworks: PresetTypes.PresetFramework[] = ['tanstack', 'next', 'expo']

const presetCssFallback = {
  tanstack: 'application/styles.css',
  next: 'app/globals.css',
  expo: 'application/styles.css',
} satisfies Record<PresetTypes.PresetFramework, string>

function presetNormalizeKey(key: string): string {
  const portable = key.replaceAll('\\', '/')

  if (!portable.trim() || posix.isAbsolute(portable) || /^[a-z]:/i.test(portable)) {
    throw new PresetError(`Folder keys must be project-relative paths: ${key}`)
  }

  const normalized = posix.normalize(portable).replace(/\/$/, '')

  if (normalized === '..' || normalized.startsWith('../')) {
    throw new PresetError(`Folder keys must stay inside the project: ${key}`)
  }

  const segments = normalized.split('/')

  if (normalized !== '.' && segments.some((segment) => segment !== '*' && !PresetConstants.presetLiteralSegment.test(segment))) {
    throw new PresetError(`Folder keys must be literal paths; only a whole \`*\` segment may be a wildcard: ${key}`)
  }

  if (segments.slice(0, -1).includes('*')) {
    throw new PresetError(`Only the last segment of a folder key may be \`*\`: ${key}`)
  }

  return normalized
}

function presetMatches(pattern: string[], path: string[]): boolean {
  return pattern.every((segment, index) => segment === '*' || segment === path[index])
}

function presetGroupValue<K extends PresetTypes.PresetGroupName>(
  name: K,
  value: PresetTypes.PresetGroups[K],
  inherited: PresetTypes.PresetGroupSettings<K> | null | undefined,
  severity: PresetTypes.PresetLevel | undefined,
): PresetTypes.PresetGroupSettings<K> | null {
  if (value === undefined) {
    return inherited && severity ? { ...inherited, level: severity } : (inherited ?? null)
  }

  if (value === false) {
    return null
  }

  const base = inherited ?? PresetConstants.presetGroupOptions[name]

  if (value === true) {
    return { ...base, level: severity ?? base.level }
  }

  if (value === 'warn') {
    return { ...base, level: 'warn' }
  }

  const changes: Partial<PresetTypes.PresetGroupSettings<K>> = Object(value)
  const unknown = Object.keys(changes).find((key) => !(key in base) || key === 'level')

  if (unknown) {
    throw new PresetError(`Unknown option \`${name}.${unknown}\`.`)
  }

  return { ...base, ...changes, level: severity ?? base.level }
}

function presetEffective(folder: PresetTypes.PresetFolder, parent: PresetTypes.PresetEffective | null): PresetTypes.PresetEffective {
  const resolveGroup = <K extends PresetTypes.PresetGroupName>(name: K) => {
    const defaults = PresetConstants.presetDefaultGroups.includes(name) ? PresetConstants.presetGroupOptions[name] : null

    return [name, presetGroupValue(name, folder[name], parent ? parent[name] : defaults, folder.severity)]
  }

  // SAFETY: every entry pairs a group name with that same group's resolved settings.
  return Object.fromEntries(PresetConstants.presetGroupOrder.map(resolveGroup)) as PresetTypes.PresetEffective
}

function presetFolder(key: string, value: unknown): PresetTypes.PresetFolder {
  if (value === true || value === false) {
    return {}
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PresetError(`Folder \`${key}\` takes true, false or an object.`)
  }

  const options = Object.keys(value)
  const groups: string[] = PresetConstants.presetGroupOrder
  const unknown = options.find((option) => !PresetConstants.presetFolderKeys.includes(option) && !groups.includes(option))

  if (unknown) {
    throw new PresetError(`Unknown folder option \`${unknown}\` in \`${key}\`.`)
  }

  // SAFETY: the object holds only folder options and group names, checked above; each group value is validated when resolved.
  const folder = value as PresetTypes.PresetFolder

  if (folder.severity !== undefined && !['error', 'warn'].includes(folder.severity)) {
    throw new PresetError(`Folder \`${key}\` severity must be 'error' or 'warn'.`)
  }

  return folder
}

function presetUnitSource(root: string, key: string, kind: PresetTypes.PresetKind, source: string | undefined): string {
  if (source !== undefined) {
    if (source !== '.' && !source.split('/').every((segment) => PresetConstants.presetLiteralSegment.test(segment))) {
      throw new PresetError(`Folder \`${key}\` source must be \`.\` or a literal relative path.`)
    }

    return posix.join(key, source)
  }

  return kind === 'console' || (key === '.' && !existsSync(resolve(root, 'src'))) ? key : posix.join(key, 'src')
}

function presetUnit(root: string, key: string, scope: PresetTypes.PresetScope): PresetTypes.PresetUnit {
  const { effective } = scope
  const frameworks = presetFrameworks.filter((name) => effective[name])

  if (frameworks.length > 1) {
    throw new PresetError(`Folder \`${key}\` enables more than one of tanstack, next and expo.`)
  }

  const [framework] = frameworks

  if (frameworks.length > 0 && effective.backend) {
    throw new PresetError(`Folder \`${key}\` is either an app (tanstack, next, expo) or a backend, not both.`)
  }

  let kind: PresetTypes.PresetKind = 'library'

  if (frameworks.length > 0) {
    kind = 'web'
  } else if (effective.backend) {
    kind = 'backend'
  } else if (effective.console) {
    kind = 'console'
  }

  const layout: Record<string, PresetTypes.PresetLayoutMode> = {}
  const settings = effective.layout

  if (settings) {
    const services = settings.services ?? (kind === 'console' ? false : 'domain')
    const hooks = settings.hooks ?? (kind === 'web' ? 'flat' : false)
    const modes = { services, hooks, components: settings.components ?? false }

    for (const [folder, mode] of Object.entries(modes)) {
      if (mode === 'flat' || mode === 'domain') {
        layout[folder] = mode
      }
    }
  }

  return { key, scope, kind, framework, source: presetUnitSource(root, key, kind, scope.folder.source), layout }
}

function presetScopesTree(root: string, folders: PresetTypes.PresetFolders): PresetTypes.PresetScope[] {
  const entries = Object.entries(folders).map(([key, value]): [string, boolean | PresetTypes.PresetFolder] => [presetNormalizeKey(key), value])
  const keys = entries.map(([key]) => key)
  const duplicate = keys.find((key, index) => keys.indexOf(key) !== index)

  if (duplicate) {
    throw new PresetError(`Folder \`${duplicate}\` is listed twice.`)
  }

  for (const key of keys) {
    const base = key.endsWith('/*') ? key.slice(0, -2) : key

    if (!existsSync(resolve(root, base))) {
      throw new PresetError(`Folder \`${key}\` does not exist.`)
    }
  }

  const rootFolder = entries.find(([key]) => key === '.')?.[1]
  const rootScope: PresetTypes.PresetScope = { key: '.', parent: null, depth: 0, folder: presetFolder('.', rootFolder ?? true), effective: {} }

  rootScope.effective = presetEffective(rootScope.folder, null)

  const scopes = [rootScope]

  const sorted = entries
    .filter(([key]) => key !== '.')
    .toSorted(([left], [right]) => left.split('/').length - right.split('/').length || Number(right.includes('*')) - Number(left.includes('*')))

  for (const [key, value] of sorted) {
    const segments = key.split('/')

    const parents = scopes.filter((candidate) => {
      if (candidate.key === '.') {
        return false
      }

      const pattern = candidate.key.split('/')
      const sibling = pattern.length === segments.length && candidate.key.includes('*') && !key.includes('*')

      return (pattern.length < segments.length || sibling) && presetMatches(pattern, segments)
    })

    const parent = parents.at(-1) ?? rootScope
    const folder = presetFolder(key, value)

    scopes.push({
      key,
      parent,
      depth: segments.length,
      folder: value === false ? { ...folder, severity: undefined } : folder,
      effective: presetEffective(folder, parent.effective),
    })
  }

  return scopes.map((scope) => (folders[scope.key] === false ? { ...scope, effective: {} } : scope))
}

export function presetProject(config: PresetTypes.PresetConfig): PresetTypes.PresetProject {
  const root = resolve(config.root ?? process.cwd())
  const scopes = presetScopesTree(root, config.folders)
  const ignored = new Set(Object.entries(config.folders).flatMap(([key, value]) => (value === false ? [presetNormalizeKey(key)] : [])))
  const live = scopes.filter((scope) => !ignored.has(scope.key))

  const unitScopes = live.filter(
    (scope) => scope.key !== '.' && (scope.parent?.key === '.' || (scope.parent?.depth === scope.depth && !scope.key.includes('*'))),
  )

  const explicit = new Set(unitScopes.map((scope) => scope.key))

  const units = (unitScopes.length > 0 ? unitScopes : live.slice(0, 1)).flatMap((scope) => {
    if (!scope.key.endsWith('/*')) {
      return [presetUnit(root, scope.key, scope)]
    }

    const base = scope.key.slice(0, -2)

    return readdirSync(resolve(root, base))
      .filter((name) => !name.startsWith('.') && statSync(resolve(root, base, name)).isDirectory())
      .map((name) => posix.join(base, name))
      .filter((key) => !explicit.has(key) && !ignored.has(key))
      .map((key) => presetUnit(root, key, scope))
  })

  const of = (kind: PresetTypes.PresetKind) => units.filter((unit) => unit.kind === kind)
  const webUnits = of('web')
  const web = webUnits.map((unit) => unit.source)
  const backendUnits = of('backend')
  const backend = backendUnits.map((unit) => unit.source)
  const backendRoots = backendUnits.map((unit) => unit.key)
  const libraryUnits = of('library')
  const packageSources = libraryUnits.map((unit) => unit.source)
  const app = [...web, ...backend, ...packageSources]
  const appFiles = presetScopes(app)
  const webFiles = presetScopes(web)
  const effective = live.map((scope) => scope.effective)
  const suffixes = [...new Set(effective.flatMap((groups) => groups.layout?.suffixes ?? []))]

  if (suffixes.some((suffix) => !/^[a-z][a-z0-9-]*$/.test(suffix))) {
    throw new PresetError('Layout suffixes must be lowercase kebab-case names.')
  }

  if (suffixes.some((suffix) => PresetConstants.presetBuiltinFileRoles.includes(suffix))) {
    throw new PresetError('Layout suffixes must not replace built-in file roles.')
  }

  const orpcScopes = effective.flatMap((groups) => (groups.orpc ? [groups.orpc] : []))
  const listOf = (values: (string[] | undefined)[]) => [...new Set(values.flatMap((value) => value ?? []))]
  const client = orpcScopes.find((settings) => settings.client !== undefined)?.client

  const rpcClients = client === undefined
    ? webUnits.map((unit) => posix.join(unit.source, 'services', unit.layout.services === 'domain' ? 'rpc/rpc.client.ts' : 'rpc.client.ts'))
    : [client]

  const kitUnits = units.filter((unit) => unit.scope.effective.kit)
  const uiRoots = [...new Set([...web.map((path) => posix.join(path, 'components/ui')), ...kitUnits.map((unit) => unit.source)])]
  const webUiRoots = uiRoots.filter((path) => web.some((webRoot) => webRoot === '.' || path === webRoot || path.startsWith(`${webRoot}/`)))

  const webCss = Object.fromEntries(
    webUnits.flatMap((unit) => {
      const tailwind = unit.scope.effective.tailwind

      if (!tailwind || !unit.framework) {
        return []
      }

      return [[unit.source, resolve(root, tailwind.css ?? posix.join(unit.source, presetCssFallback[unit.framework]))]]
    }),
  )

  const webStylesheets = [...new Set(Object.values(webCss))]

  const kitCss = Object.fromEntries(
    kitUnits.flatMap((unit) => {
      const tailwind = unit.scope.effective.tailwind

      if (!tailwind || webUiRoots.includes(unit.source) || unit.kind === 'web') {
        return []
      }

      if (tailwind.css !== undefined) {
        return [[unit.source, resolve(root, tailwind.css)]]
      }

      if (webStylesheets.length === 1) {
        return [[unit.source, webStylesheets[0]]]
      }

      throw new PresetError(`The UI kit ${unit.key} needs a Tailwind stylesheet: set tailwind.css on it.`)
    }),
  )

  const backendExports = listOf(effective.map((groups) => groups.backend?.exports))

  const publicEntrypoints = backendExports.length > 0
    ? backendExports
    : backendRoots.flatMap((directory) => {
      const name = presetPackageName(root, directory)

      return name ? [`${name}/client`] : []
    })

  const aliases = Object.fromEntries(
    effective.flatMap((groups) => Object.entries(groups.imports?.aliases ?? {})).map(([alias, path]) => [alias.replace(/\/$/, ''), resolve(root, path)]),
  )

  return {
    root,
    scopes: live,
    units,
    suffixes,
    colocated: listOf(effective.map((groups) => groups.types?.colocated)),
    aliases,
    internal: scopes[0].effective.imports?.internal,
    orpc: {
      public: listOf(orpcScopes.map((settings) => settings.public)),
      composers: listOf(orpcScopes.map((settings) => settings.composers)),
      client: client ?? '',
    },
    layouts: units.flatMap((unit) =>
      Object.entries(unit.layout).map(([folder, mode]) => ({ path: posix.join(unit.source, folder), folder, mode })),
    ),
    rpcClients,
    packages: libraryUnits.map((unit) => unit.key),
    scripts: of('console').map((unit) => unit.key),
    web,
    tanstackWeb: webUnits.filter((unit) => unit.framework === 'tanstack').map((unit) => unit.source),
    nextWeb: webUnits.filter((unit) => unit.framework === 'next').map((unit) => unit.source),
    expoWeb: webUnits.filter((unit) => unit.framework === 'expo').map((unit) => unit.source),
    backend,
    backendRoots,
    packageSources,
    serviceRoots: [...backend, ...packageSources],
    app,
    appFiles,
    webFiles,
    reactFiles: [
      ...webFiles,
      ...presetScopes(packageSources, '**/*.tsx'),
      ...presetScopes(packageSources, `components/**/${PresetConstants.presetExtensions}`),
      ...presetScopes(packageSources, `hooks/**/${PresetConstants.presetExtensions}`),
    ],
    backendFiles: presetScopes(backend),
    services: presetScopes(app, `services/**/${PresetConstants.presetExtensions}`),
    utilities: ['**/*.utils.ts', '**/*.constants.ts', '**/*.types.ts'],
    types: presetScopes(app, 'types/**'),
    uiRoots,
    webUiRoots,
    ui: presetScopes(uiRoots, '**'),
    generated: PresetConstants.presetGeneratedFiles,
    testFiles: PresetConstants.presetTestFiles,
    safetyFiles: [...appFiles, ...PresetConstants.presetTestFiles],
    components: presetScopes([...web, ...packageSources], 'components/**/*.tsx'),
    hooks: presetScopes([...web, ...packageSources], 'hooks/**/*.ts'),
    publicEntrypoints,
    baseImports: PresetConstants.presetBaseImports,
    css: { ...webCss, ...kitCss },
    ignores: [...ignored].map((key) => `${key}/**`),
  }
}
