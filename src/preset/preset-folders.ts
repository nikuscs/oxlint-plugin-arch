import { existsSync, readdirSync, realpathSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { presetDetect, presetRegistryFile } from './preset-detect.ts'
import { presetStylesheet } from './preset-stylesheet.ts'
import { presetUnits } from './preset-units.ts'
import * as PresetConstants from './preset.constants.ts'
import { PresetError, presetIsDirectory, presetManifest, presetScopes, presetServiceScopes } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'

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

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PresetError(`Group \`${name}\` takes true, false, 'warn' or an options object.`)
  }

  const changes: Partial<PresetTypes.PresetGroupSettings<K>> = Object(value)
  const unknown = Object.keys(changes).find((key) => !(key in base) || key === 'level')

  if (unknown) {
    throw new PresetError(`Unknown option \`${name}.${unknown}\`.`)
  }

  const plain = (option: unknown) => option instanceof Object && !Array.isArray(option)

  const merged = Object.fromEntries(
    Object.entries(changes).map(([key, option]) => {
      const stored: unknown = Object(base)[key]
      const field = PresetConstants.presetShorthandOptions.find(([group, setting]) => group === name && setting === key)?.[2]
      const previous = typeof stored === 'string' && field !== undefined && plain(option) ? { [field]: stored } : stored

      return [key, plain(previous) && plain(option) ? { ...Object(previous), ...Object(option) } : option]
    }),
  )

  return { ...base, ...merged, level: severity ?? base.level }
}

function presetDenyEntries(inherited: Record<string, string>, changes: Record<string, string | false> | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries({ ...inherited, ...changes }).flatMap(([key, message]) => {
      if (message !== false && typeof message !== 'string') {
        throw new PresetError(`Deny entry \`${key}\` takes a message string or false.`)
      }

      return message === false ? [] : [[key, message]]
    }),
  )
}

function presetEffective(folder: PresetTypes.PresetFolder, parent: PresetTypes.PresetEffective | null): PresetTypes.PresetEffective {
  const resolveGroup = <K extends PresetTypes.PresetGroupName>(name: K) => {
    const defaults = PresetConstants.presetDefaultGroups.includes(name) ? PresetConstants.presetGroupOptions[name] : null

    return [name, presetGroupValue(name, folder[name], parent ? parent[name] : defaults, folder.severity)]
  }

  // SAFETY: every entry pairs a group name with that same group's resolved settings.
  const effective = Object.fromEntries(PresetConstants.presetGroupOrder.map(resolveGroup)) as PresetTypes.PresetEffective
  const deny = folder.deny

  if (effective.deny && deny instanceof Object) {
    const inherited = (parent ? parent.deny : null) ?? PresetConstants.presetGroupOptions.deny

    effective.deny = {
      ...effective.deny,
      imports: presetDenyEntries(inherited.imports, deny.imports),
      calls: presetDenyEntries(inherited.calls, deny.calls),
    }
  }

  return effective
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
      folder,
      effective: presetEffective(folder, parent.effective),
    })
  }

  return scopes
}

export function presetProject(config: PresetTypes.PresetConfig): PresetTypes.PresetProject {
  const given = resolve(config.root ?? process.cwd())
  const root = existsSync(given) ? realpathSync(given) : given
  const listed = Object.entries(config.folders ?? {}).map(([key, value]): [string, boolean | PresetTypes.PresetFolder] => [presetNormalizeKey(key), value])
  const twice = listed.find(([key], index) => listed.findIndex(([other]) => other === key) !== index)

  if (twice) {
    throw new PresetError(`Folder \`${twice[0]}\` is listed twice.`)
  }

  const folders = config.detect === false ? Object.fromEntries(listed) : presetDetect(root, Object.fromEntries(listed))
  const scopes = presetScopesTree(root, folders)
  const ignored = new Set(Object.entries(folders).flatMap(([key, value]) => (value === false ? [presetNormalizeKey(key)] : [])))
  const live = scopes.filter((scope) => !ignored.has(scope.key))
  const dead = live.find((scope) => scope.parent && ignored.has(scope.parent.key) && scope.parent.depth < scope.depth)

  if (dead) {
    throw new PresetError(`Folder \`${dead.key}\` sits inside the skipped folder \`${dead.parent?.key}\`.`)
  }

  const units = presetUnits(root, scopes, ignored)

  const unitKeys = new Set(units.map((unit) => unit.scope.key))
  const misplaced = live.find((scope) => !unitKeys.has(scope.key) && Object(scope.folder.layout).operations !== undefined)

  const servicesKey = live.find((scope) => !unitKeys.has(scope.key) && scope.folder.services !== undefined)

  if (servicesKey) {
    throw new PresetError(`Set services on an app or package folder, not on \`${servicesKey.key}\`.`)
  }

  if (misplaced) {
    throw new PresetError(`Set layout.operations on an app or package folder, not on \`${misplaced.key}\`.`)
  }

  const writes = live.find((scope) => !unitKeys.has(scope.key) && Object(scope.folder.backend).writes !== undefined)

  if (writes) {
    throw new PresetError(`Set backend.writes on a backend folder, not on \`${writes.key}\`.`)
  }

  const of = (kind: PresetTypes.PresetKind) => units.filter((unit) => unit.kind === kind)
  const webUnits = of('web')
  const web = webUnits.map((unit) => unit.source)
  const backendUnits = of('backend')
  const backend = backendUnits.map((unit) => unit.source)
  const backendRoots = backendUnits.map((unit) => unit.key)
  const libraryUnits = of('library')
  const packageSources = libraryUnits.map((unit) => unit.source)
  const app = [...web, ...backend, ...packageSources]
  const serviceFolders = Object.fromEntries(units.map((unit) => [unit.source, unit.services]))
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
    ? webUnits.map((unit) => posix.join(unit.services, unit.layout.services === 'domain' ? 'rpc/rpc.client.ts' : 'rpc.client.ts'))
    : [client]

  const kitUnits = units.filter((unit) => unit.scope.effective.kit)
  const uiRoots = [...new Set([...web.map((path) => posix.join(path, 'components/ui')), ...kitUnits.map((unit) => unit.source)])]
  const webUiRoots = uiRoots.filter((path) => web.some((webRoot) => webRoot === '.' || path === webRoot || path.startsWith(`${webRoot}/`)))

  const stylesheet = (unit: PresetTypes.PresetUnit) => {
    const tailwind = unit.scope.effective.tailwind

    if (!tailwind) {
      return undefined
    }

    const css = tailwind.css ?? presetStylesheet(root, unit.key)

    return css === undefined ? undefined : resolve(root, css)
  }

  const webCss = Object.fromEntries(webUnits.flatMap((unit) => {
    const css = stylesheet(unit)

    return css ? [[unit.source, css]] : []
  }))

  const webStylesheets = [...new Set(Object.values(webCss))]

  const kitCss = Object.fromEntries(
    units
      .filter((unit) => unit.kind !== 'web' && unit.scope.effective.tailwind && !webUiRoots.includes(unit.source))
      .flatMap((unit) => {
        const name = presetManifest(root, unit.key).name ?? ''

        const consumer = webUnits.find((candidate) => {
          const manifest = presetManifest(root, candidate.key)

          return name in { ...manifest.dependencies, ...manifest.devDependencies }
        })

        const css = stylesheet(unit) ?? (unit.scope.effective.kit ? ((consumer && webCss[consumer.source]) ?? webStylesheets.at(0)) : undefined)

        if (css === undefined && unit.scope.effective.kit) {
          throw new PresetError(`The UI kit ${unit.key} needs a Tailwind stylesheet: set tailwind.css on it.`)
        }

        return css ? [[unit.source, css]] : []
      }),
  )

  const backendExports = listOf(effective.map((groups) => groups.backend?.exports))

  const publicEntrypoints = backendExports.length > 0
    ? backendExports
    : backendRoots.flatMap((directory) => {
      const manifest = presetManifest(root, directory)
      const entries = manifest.exports instanceof Object ? Object.keys(manifest.exports).filter((key) => key.startsWith('./')) : []

      if (!manifest.name) {
        return []
      }

      return entries.length > 0 ? entries.map((key) => `${manifest.name}/${key.slice(2)}`) : [`${manifest.name}/client`]
    })

  const publicProcedures = listOf(orpcScopes.map((settings) => settings.public))

  const skipped = [...ignored].flatMap((key) => {
    if (!key.endsWith('/*')) {
      return [key]
    }

    const base = key.slice(0, -2)

    return readdirSync(resolve(root, base))
      .filter((name) => presetIsDirectory(resolve(root, base, name)))
      .map((name) => posix.join(base, name))
      .filter((path) => !live.some((scope) => scope.key === path))
  })

  return {
    root,
    serviceFolders,
    scopes: live,
    units,
    suffixes,
    colocated: listOf(effective.map((groups) => groups.types?.colocated)),
    orpc: {
      public: publicProcedures.length > 0
        ? publicProcedures
        : backendUnits.map((unit) => posix.join(unit.source, 'rpc/api')).filter((path) => existsSync(resolve(root, path))).map((path) => `${path}/**`),
      composers: listOf(orpcScopes.map((settings) => settings.composers)),
      client: client ?? '',
    },
    layouts: units.flatMap((unit) =>
      Object.entries(unit.layout).map(([folder, mode]) => ({ path: folder === 'services' ? unit.services : posix.join(unit.source, folder), folder, mode })),
    ),
    rpcClients,
    operations: units.flatMap((unit) => (unit.scope.effective.layout?.operations === 'folders' ? [unit.source] : [])),
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
    services: presetServiceScopes(serviceFolders, app),
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
    registries: backendUnits.flatMap((unit) => presetRegistryFile(root, unit.source, unit.scope.effective.backend?.registry, unit.services) ?? []),
    ignores: skipped.map((key) => `${key}/**`),
    outputs: ['.', ...units.map((unit) => unit.key)].flatMap((key) => PresetConstants.presetOutputFolders.map((folder) => (key === '.' ? `${folder}/**` : `${key}/${folder}/**`))),
  }
}
