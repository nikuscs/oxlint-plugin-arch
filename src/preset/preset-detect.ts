import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { matchesGlob, posix, resolve } from 'node:path'
import { presetRecipes } from './preset-recipes.ts'
import * as PresetConstants from './preset.constants.ts'
import { presetIsDirectory, presetManifest, presetServicesFolder } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'

function presetDirectories(root: string, base: string, skip = PresetConstants.presetDetectSkip): string[] {
  if (!presetIsDirectory(resolve(root, base))) {
    return []
  }

  return readdirSync(resolve(root, base))
    .filter((name) => !name.startsWith('.') && !skip.includes(name) && presetIsDirectory(resolve(root, base, name)))
    .map((name) => posix.join(base, name))
}

const presetNamedSkip = ['node_modules']

function presetSource(root: string, directory: string, configured?: string): string {
  if (configured !== undefined) {
    return posix.join(directory, configured)
  }

  return existsSync(resolve(root, directory, 'src')) ? posix.join(directory, 'src') : directory
}

export function presetRegistryFile(root: string, source: string, configured: PresetTypes.PresetBackendOptions['registry'], services: string): string | undefined {
  if (configured === false) {
    return undefined
  }

  const file = typeof configured === 'string' ? configured : configured?.file

  if (file !== undefined) {
    return posix.normalize(file)
  }

  return [posix.join(services, 'service.ts'), ...PresetConstants.presetRegistryFiles.map((path) => posix.join(source, path))].find((path) => existsSync(resolve(root, path)))
}

function presetDomains(root: string, services: string): string[] {
  return presetDirectories(root, services, presetNamedSkip)
    .map((path) => posix.basename(path))
    .filter((name) => existsSync(resolve(root, services, name, `${name}.service.ts`)))
}

function presetRecipe(root: string, directory: string, app: boolean, folder: PresetTypes.PresetFolder): PresetTypes.PresetRecipe {
  const manifest = presetManifest(root, directory)
  const dependencies = new Set([manifest.dependencies, manifest.devDependencies, manifest.peerDependencies].flatMap((listed) => Object.keys(listed ?? {})))
  const has = (names: string[]) => names.some((name) => dependencies.has(name))
  const source = presetSource(root, directory, folder.source)
  const framework = PresetConstants.presetDetectFrameworks.find(([, names]) => has(names))?.[0]
  const servicesFolder = presetServicesFolder(root, source, folder.services, app)
  const services = resolve(root, servicesFolder)
  const entries = presetIsDirectory(services) ? readdirSync(services, { withFileTypes: true }) : []
  const folders = entries.filter((entry) => presetIsDirectory(resolve(services, entry.name))).length
  const flat = entries.filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name)).length > folders

  if (framework) {
    return flat ? { ...presetRecipes[framework], layout: { services: 'flat' } } : presetRecipes[framework]
  }

  if (has(PresetConstants.presetDetectDesktop)) {
    return presetRecipes.desktop
  }

  if (presetDomains(root, servicesFolder).length > 0 || (has(PresetConstants.presetDetectBackend) && (app || presetIsDirectory(services)))) {
    return presetRecipes.backend
  }

  if (has(['react']) && presetIsDirectory(resolve(root, source, 'components'))) {
    return app ? presetRecipes.react : presetRecipes.ui
  }

  return presetRecipes.library
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

function presetMerge(base: boolean | PresetTypes.PresetFolder | undefined, top: boolean | PresetTypes.PresetFolder): boolean | PresetTypes.PresetFolder {
  if (!(base instanceof Object) || !(top instanceof Object)) {
    return top === true && base instanceof Object ? base : top
  }

  return presetMergeObject(base, top, 2)
}

function presetImportTargets(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap(presetImportTargets)
  }

  return value instanceof Object ? Object.values(value).flatMap(presetImportTargets) : []
}

function presetSpecifiers(manifest: PresetTypes.PresetManifest, target: string, file = false): string[] {
  const specifiers = Object.entries(manifest.imports ?? {}).flatMap(([key, value]) =>
    presetImportTargets(value).flatMap((mapped) => {
      const path = posix.normalize(mapped)
      const parts = path.split('*')
      const keyParts = key.split('*')

      if (parts.length === 1 && keyParts.length === 1) {
        return path.replace(/\.[cm]?[jt]sx?$/, '') === target ? [key] : []
      }

      if (parts.length !== 2 || keyParts.length !== 2) {
        return []
      }

      const [before, after] = parts
      const [head, suffix] = keyParts
      const prefix = before.replace(/\/$/, '')

      if (target !== prefix && !target.startsWith(`${prefix}/`)) {
        return []
      }

      const rest = target.slice(prefix.length).replace(/^\//, '')
      const tail = after && rest.endsWith(after) ? rest.slice(0, -after.length) : rest

      return [`${head}${tail}${file ? suffix : ''}`.replace(/\/$/, '')]
    }),
  )

  return [...new Set(specifiers)]
}

function presetOverlaps(left: string, right: string): boolean {
  const [leftBase] = left.split('*')
  const [rightBase] = right.split('*')

  return leftBase.startsWith(rightBase) || rightBase.startsWith(leftBase)
}

function presetDeny(imports: Record<string, string | false>): PresetTypes.PresetFolder {
  return { deny: { imports } }
}

function presetFilled(conventions: PresetTypes.PresetFolders, exists: (path: string) => boolean): PresetTypes.PresetFolders {
  return Object.fromEntries(
    Object.entries(conventions).filter(([path, folder]) => {
      const empty = folder instanceof Object && folder.deny instanceof Object && Object.keys(folder.deny.imports ?? {}).length === 0

      return exists(path) && !empty
    }),
  )
}

function presetBackendConventions(
  root: string,
  key: string,
  value: PresetTypes.PresetFolder,
  denied: Set<string>,
): PresetTypes.PresetFolders {
  const manifest = presetManifest(root, key)
  const source = presetSource(root, key, value.source)
  const local = posix.relative(key, source) || '.'
  const at = (path: string) => (local === '.' ? path : posix.join(local, path))
  const exists = (path: string) => existsSync(resolve(root, key, path))
  const configured = value.backend instanceof Object ? value.backend.registry : undefined
  const servicesFolder = presetServicesFolder(root, source, value.services)
  const servicesKey = posix.relative(key, servicesFolder)
  const registryFile = presetRegistryFile(root, source, configured, servicesFolder)
  const registry = registryFile === undefined ? undefined : posix.relative(key, registryFile)
  const services = presetSpecifiers(manifest, servicesKey)
  const message = 'Use the service API, not another service’s operations.'

  const operations = Object.fromEntries(
    services.flatMap((prefix) => PresetConstants.presetOperationImports.map((pattern) => [`${prefix}/${pattern}`, message])),
  )

  const registryImports = registry
    ? Object.fromEntries(
      presetSpecifiers(manifest, registry.replace(/\.[cm]?[jt]sx?$/, ''), true).map((specifier) => [specifier, 'Only the composition root imports the service registry.']),
    )
    : {}

  const entries = Object.fromEntries(
    PresetConstants.presetServerEntries.map((entry) => [`${manifest.name}/${entry}`, 'Server code imports its own modules, not the package entries.']),
  )

  const serviceImports = { ...registryImports, ...operations }

  if (manifest.name) {
    Object.assign(serviceImports, entries)
  }

  const conventions: PresetTypes.PresetFolders = {
    [servicesKey]: presetDeny(serviceImports),
    [at('core')]: presetDeny(operations),
    [at('rpc')]: presetDeny(registryImports),
    [at('routes')]: presetDeny(registryImports),
    [at('cli')]: {
      naming: { files: PresetConstants.presetCliFiles },
      ...presetDeny({ ...operations, ...Object.fromEntries(services.map((prefix) => [`${prefix}/*/*.service`, 'Reach services through the registry.'])) }),
    },
  }

  for (const domain of presetDirectories(root, servicesFolder, presetNamedSkip).map((path) => posix.basename(path))) {
    const imports = services.flatMap((prefix) =>
      PresetConstants.presetOperationImports
        .filter((pattern) => !denied.has(`${prefix}/${pattern}`))
        .flatMap((pattern): [string, string | false][] => [
          [`${prefix}/${pattern}`, false],
          [`${prefix}/${pattern.replace(/^\*/, `!(${domain})`)}`, message],
        ]),
    )

    conventions[posix.join(servicesKey, domain)] = presetDeny(Object.fromEntries(imports))
  }

  const testFolders = ['tests', 'test']

  for (const tests of testFolders) {
    if (exists(posix.join(tests, 'kits'))) {
      conventions[tests] = presetDeny(Object.fromEntries(PresetConstants.presetKitImports.map((pattern) => [pattern, 'Import the kit file you need.'])))
      conventions[posix.join(tests, 'kits')] = { naming: { files: PresetConstants.presetKitFiles } }
    }
  }

  const queue = ['.']

  while (queue.length > 0) {
    const folder = queue.shift() ?? '.'

    for (const child of presetDirectories(root, posix.join(key, folder)).map((path) => posix.relative(key, path))) {
      if (posix.basename(child) === 'migrations') {
        conventions[child] = { layout: false, naming: { files: PresetConstants.presetMigrationFiles, unique: PresetConstants.presetMigrationNumber } }
      } else if (child.split('/').length < 8 && !testFolders.includes(posix.basename(child))) {
        queue.push(child)
      }
    }
  }

  return presetFilled(conventions, exists)
}

function presetWebConventions(root: string, key: string, value: PresetTypes.PresetFolder, servers: PresetTypes.PresetManifest[]): PresetTypes.PresetFolders {
  const source = posix.relative(key, presetSource(root, key, value.source)) || '.'
  const at = (path: string) => (source === '.' ? path : posix.join(source, path))
  const exists = (path: string) => existsSync(resolve(root, key, path))
  const own = Object.keys(presetManifest(root, key).imports ?? {})

  const internals = servers.flatMap((manifest) =>
    Object.keys(manifest.imports ?? {})
      .filter((specifier) => !own.some((mine) => presetOverlaps(mine, specifier)))
      .map((specifier) => specifier.replace(/\*$/, '**')),
  )

  const named = servers.flatMap((manifest) => (manifest.name ? [manifest.name] : []))
  const entries = Object.fromEntries(named.flatMap((name) => PresetConstants.presetServerEntries.map((entry) => [`${name}/${entry}`, 'UI code imports the client entry.'])))
  const clients = Object.fromEntries(named.map((name) => [`${name}/client`, 'Route handlers run on the server; import the server entry.']))

  const appImports: Record<string, string | false> = Object.fromEntries(internals.map((specifier) => [specifier, 'Import the backend through its client entry.']))

  if (servers.length > 0) {
    appImports['**/services/*.service'] = 'Import the client or rsc service file, not a server service.'
  }

  const conventions: PresetTypes.PresetFolders = {
    '.': presetDeny(appImports),
    [at('components')]: presetDeny(entries),
    [at('routes')]: presetDeny(entries),
    [at('routes/handlers')]: { deny: { imports: { ...clients, ...Object.fromEntries(Object.keys(entries).map((entry) => [entry, false])) } } },
  }

  return presetFilled(conventions, exists)
}

function presetWorkspacePatterns(root: string, manifest: PresetTypes.PresetManifest): string[] {
  const listed = Array.isArray(manifest.workspaces) ? manifest.workspaces : (manifest.workspaces?.packages ?? [])
  const file = resolve(root, 'pnpm-workspace.yaml')

  if (!existsSync(file)) {
    return listed
  }

  const patterns = [...listed]
  let inside = false

  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const flow = /^packages\s*:\s*\[(.*)\]/.exec(line)
    const item = /^\s*-\s*(["']?)([^"'#\s]+)\1\s*(?:#.*)?$/.exec(line)

    if (flow) {
      patterns.push(...flow[1].split(',').map((entry) => entry.trim().replaceAll(/^["']|["']$/g, '')).filter(Boolean))
      inside = false
    } else if (/^packages\s*:/.test(line)) {
      inside = true
    } else if (inside && item) {
      patterns.push(item[2])
    } else if (/^\S/.test(line)) {
      inside = false
    }
  }

  return patterns
}

function presetWorkspaces(root: string, patterns: string[]): string[] {
  const clean = (pattern: string) => posix.normalize(pattern.replace(/^\.\//, '')).replace(/\/$/, '')
  const include = patterns.filter((pattern) => !pattern.startsWith('!')).map(clean)
  const exclude = patterns.filter((pattern) => pattern.startsWith('!')).map((pattern) => clean(pattern.slice(1)))
  const matches = (path: string, globs: string[]) => globs.some((glob) => path === glob || matchesGlob(path, glob))
  const candidates = new Set<string>()

  for (const pattern of include) {
    const segments = pattern.split('/')
    const literal = segments.findIndex((segment) => /[*?{[]/.test(segment))

    if (literal === -1) {
      candidates.add(pattern)
      continue
    }

    const depth = segments.includes('**') ? 8 : segments.length - literal
    let level = [segments.slice(0, literal).join('/') || '.']

    for (let step = 0; step < depth; step++) {
      level = level.flatMap((folder) => presetDirectories(root, folder, presetNamedSkip))
      level.forEach((folder) => candidates.add(folder))
    }
  }

  return [...candidates]
    .filter((path) => matches(path, include) && !matches(path, exclude) && existsSync(resolve(root, path, 'package.json')))
    .toSorted()
}

function presetContains(key: string, path: string): boolean {
  if (key === '.' || key === path) {
    return true
  }

  const pattern = key.split('/')
  const segments = path.split('/')

  return pattern.length <= segments.length && pattern.every((segment, index) => segment === '*' || segment === segments[index])
}

function presetOwner(
  folders: PresetTypes.PresetFolders,
  path: string,
  owns: (value: boolean | PresetTypes.PresetFolder) => boolean,
): boolean | PresetTypes.PresetFolder | undefined {
  const depth = (key: string) => (key === '.' ? 0 : key.split('/').length)

  return Object.entries(folders)
    .filter(([key, value]) => presetContains(key, path) && owns(value))
    .toSorted(([left], [right]) => depth(left) - depth(right) || Number(right.includes('*')) - Number(left.includes('*')))
    .at(-1)?.[1]
}

function presetGroupOff(folders: PresetTypes.PresetFolders, path: string, group: string): boolean {
  const owner = presetOwner(folders, path, (value) => value instanceof Object && group in value)

  return owner instanceof Object && Object(owner)[group] === false
}

export function presetDetect(root: string, folders: PresetTypes.PresetFolders): PresetTypes.PresetFolders {
  const manifest = presetManifest(root, '.')

  const configured = (key: string): PresetTypes.PresetFolder => {
    const value = folders[key]

    return value instanceof Object ? value : {}
  }

  const patterns = presetWorkspacePatterns(root, manifest)
  const directories = presetWorkspaces(root, patterns)

  const detected: PresetTypes.PresetFolders = Object.fromEntries(
    directories.map((directory) => [directory, presetRecipe(root, directory, !directory.startsWith('packages/'), configured(directory))]),
  )

  const rootRecipe = presetRecipe(root, '.', true, configured('.'))
  const single = Object.keys(manifest).length > 0 || rootRecipe !== presetRecipes.library
  const rootApp = rootRecipe !== presetRecipes.library && presetSource(root, '.', configured('.').source) !== '.'

  if (patterns.length === 0 ? single : rootApp) {
    detected['.'] = rootRecipe
  }

  if (existsSync(resolve(root, 'scripts')) && !directories.includes('scripts')) {
    detected.scripts = presetRecipes.cli
  }

  const keys = Object.keys(folders)

  const covered = (key: string) =>
    keys.some((user) => user !== key && user !== '.' && (key.startsWith(`${user}/`) || (user.endsWith('/*') && posix.dirname(key) === user.slice(0, -2))))

  const merged: PresetTypes.PresetFolders = { '.': presetDeny(PresetConstants.presetRootImports) }

  for (const [key, value] of Object.entries(detected)) {
    if (!covered(key)) {
      merged[key] = presetMerge(merged[key], value)
    }
  }

  for (const [key, value] of Object.entries(folders)) {
    merged[key] = key in merged ? presetMerge(merged[key], value) : value
  }

  const length = (key: string) => key.split('/').length
  const nested = (key: string) => Object.keys(merged).some((other) => other !== '.' && length(other) < length(key) && presetContains(other, key))

  const units = Object.entries(merged).flatMap(([key, value]): [string, boolean | PresetTypes.PresetFolder][] => {
    if (key.endsWith('/*')) {
      return presetDirectories(root, key.slice(0, -2), presetNamedSkip)
        .filter((directory) => !(directory in merged))
        .map((directory) => [directory, value])
    }

    if (key.includes('*') || nested(key)) {
      return []
    }

    const siblings = Object.entries(merged).filter(([other]) => other !== key && other.endsWith('/*') && length(other) === length(key) && presetContains(other, key))

    return [[key, siblings.reduce<boolean | PresetTypes.PresetFolder>((inherited, [, sibling]) => presetMerge(sibling, inherited), value)]]
  })

  const denied = new Set(
    Object.values(folders).flatMap((folder) =>
      folder instanceof Object && folder.deny instanceof Object
        ? Object.entries(folder.deny.imports ?? {}).flatMap(([pattern, message]) => (typeof message === 'string' ? [pattern] : []))
        : [],
    ),
  )

  const servers = units.filter(([, value]) => value instanceof Object && Boolean(value.backend)).map(([key]) => presetManifest(root, key))
  const internals = servers.flatMap((server) => Object.keys(server.imports ?? {}).map((specifier) => specifier.replace(/\*$/, '**')))

  const add = (key: string, folder: boolean | PresetTypes.PresetFolder) => {
    if (presetOwner(folders, key, () => true) === false) {
      return
    }

    const kept = folder instanceof Object ? Object.fromEntries(Object.entries(folder).filter(([group]) => !presetGroupOff(folders, key, group))) : folder

    if (kept instanceof Object && Object.keys(kept).length === 0) {
      return
    }

    merged[key] = key in merged ? presetMerge(kept, merged[key]) : kept
  }

  for (const [key, value] of units) {
    if (!(value instanceof Object)) {
      continue
    }

    if (value.backend) {
      for (const [path, folder] of Object.entries(presetBackendConventions(root, key, value, denied))) {
        add(path === '.' ? key : posix.join(key, path), folder)
      }
    } else if (value.tanstack || value.next) {
      for (const [path, folder] of Object.entries(presetWebConventions(root, key, value, servers))) {
        add(path === '.' ? key : posix.join(key, path), folder)
      }
    } else if ((value.kit || key.startsWith('packages/')) && !value.expo) {
      const own = Object.keys(presetManifest(root, key).imports ?? {})
      const message = PresetConstants.presetPackageImports['../../apps/**']
      const appImports = internals.filter((specifier) => !own.some((mine) => presetOverlaps(mine, specifier))).map((specifier) => [specifier, message])

      add(key, presetDeny({ ...PresetConstants.presetPackageImports, ...Object.fromEntries(appImports) }))
    }
  }

  return merged
}
