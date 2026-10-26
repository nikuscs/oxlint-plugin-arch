import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { presetRecipes } from './preset-recipes.ts'
import * as PresetConstants from './preset.constants.ts'
import type * as PresetTypes from '../types/preset.types.ts'

export function presetManifest(root: string, directory: string): PresetTypes.PresetManifest {
  try {
    return JSON.parse(readFileSync(resolve(root, directory, 'package.json'), 'utf8'))
  } catch {
    return {}
  }
}

function presetDirectories(root: string, base: string): string[] {
  if (!existsSync(resolve(root, base))) {
    return []
  }

  return readdirSync(resolve(root, base))
    .filter((name) => !name.startsWith('.') && statSync(resolve(root, base, name)).isDirectory())
    .map((name) => posix.join(base, name))
}

function presetSource(root: string, directory: string): string {
  return existsSync(resolve(root, directory, 'src')) ? posix.join(directory, 'src') : directory
}

function presetRecipe(root: string, directory: string, app: boolean): PresetTypes.PresetRecipe {
  const manifest = presetManifest(root, directory)
  const dependencies = new Set(Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }))
  const has = (names: string[]) => names.some((name) => dependencies.has(name))
  const source = presetSource(root, directory)
  const framework = PresetConstants.presetDetectFrameworks.find(([, names]) => has(names))?.[0]

  const services = resolve(root, source, 'services')
  const entries = existsSync(services) ? readdirSync(services, { withFileTypes: true }) : []
  const flat = entries.filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name)).length > entries.filter((entry) => entry.isDirectory()).length

  if (framework) {
    return flat ? { ...presetRecipes[framework], layout: { services: 'flat' } } : presetRecipes[framework]
  }

  if (has(PresetConstants.presetDetectDesktop)) {
    return presetRecipes.desktop
  }

  if (has(PresetConstants.presetDetectBackend) && (app || existsSync(services))) {
    return presetRecipes.backend
  }

  if (has(['react']) && existsSync(resolve(root, source, 'components'))) {
    return app ? presetRecipes.react : presetRecipes.ui
  }

  return presetRecipes.library
}

function presetMergeObject(base: object, top: object, depth: number): object {
  const merged: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(top)) {
    const previous = merged[key]
    const nested = previous instanceof Object && value instanceof Object && !Array.isArray(previous) && !Array.isArray(value)

    if (nested && depth > 0) {
      merged[key] = presetMergeObject(previous, value, depth - 1)
    } else if (value !== true || !(previous instanceof Object)) {
      merged[key] = value
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

function presetSpecifiers(manifest: PresetTypes.PresetManifest, target: string): string[] {
  return Object.entries(manifest.imports ?? {}).flatMap(([key, value]) => {
    const prefix = typeof value === 'string' && value.endsWith('/*') && key.endsWith('/*') ? posix.normalize(value.slice(0, -2)) : undefined

    if (prefix === undefined || (target !== prefix && !target.startsWith(`${prefix}/`))) {
      return []
    }

    return [`${key.slice(0, -2)}${target.slice(prefix.length)}`]
  })
}

function presetDeny(imports: Record<string, string>): PresetTypes.PresetFolder {
  return { deny: { imports } }
}

function presetBackendConventions(root: string, key: string, manifest: PresetTypes.PresetManifest): PresetTypes.PresetFolders {
  const source = presetSource(root, key)
  const local = posix.relative(key, source) || '.'
  const at = (path: string) => (local === '.' ? path : posix.join(local, path))
  const exists = (path: string) => existsSync(resolve(root, key, path))
  const registry = PresetConstants.presetRegistryFiles.map(at).find(exists)
  const services = presetSpecifiers(manifest, at('services'))

  const operations = Object.fromEntries(
    services.flatMap((prefix) => PresetConstants.presetOperationImports.map((pattern) => [`${prefix}/${pattern}`, 'Use the service API, not another service’s operations.'])),
  )

  const registryImports = registry
    ? Object.fromEntries(presetSpecifiers(manifest, registry.replace(/\.ts$/, '')).map((specifier) => [specifier, 'Only the composition root imports the service registry.']))
    : {}

  const entries = Object.fromEntries(
    PresetConstants.presetServerEntries.map((entry) => [`${manifest.name}/${entry}`, 'Server code imports its own modules, not the package entries.']),
  )

  const conventions: PresetTypes.PresetFolders = {
    [at('services')]: presetDeny({
      ...registryImports,
      ...operations,
      ...(manifest.name ? entries : {}),
    }),
    [at('core')]: presetDeny(operations),
    [at('rpc')]: presetDeny(registryImports),
    [at('routes')]: presetDeny(registryImports),
    [at('cli')]: {
      naming: { files: PresetConstants.presetCliFiles },
      ...presetDeny({ ...operations, ...Object.fromEntries(services.map((prefix) => [`${prefix}/*/*.service`, 'Reach services through the registry.'])) }),
    },
  }

  for (const tests of ['tests', 'test']) {
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
      } else if (child.split('/').length < 6 && !PresetConstants.presetDetectSkip.includes(posix.basename(child))) {
        queue.push(child)
      }
    }
  }

  return Object.fromEntries(
    Object.entries(conventions).filter(([path, folder]) => {
      const empty = folder instanceof Object && folder.deny instanceof Object && Object.keys(folder.deny.imports ?? {}).length === 0

      return exists(path) && !empty
    }),
  )
}

function presetWebConventions(root: string, key: string, servers: PresetTypes.PresetManifest[]): PresetTypes.PresetFolders {
  const source = posix.relative(key, presetSource(root, key)) || '.'
  const at = (path: string) => (source === '.' ? path : posix.join(source, path))
  const exists = (path: string) => existsSync(resolve(root, key, path))
  const internals = servers.flatMap((manifest) => Object.keys(manifest.imports ?? {}).map((specifier) => specifier.replace(/\*$/, '**')))
  const named = servers.flatMap((manifest) => (manifest.name ? [manifest.name] : []))
  const entries = Object.fromEntries(named.flatMap((name) => PresetConstants.presetServerEntries.map((entry) => [`${name}/${entry}`, 'UI code imports the client entry.'])))
  const clients = Object.fromEntries(named.map((name) => [`${name}/client`, 'Route handlers run on the server; import the server entry.']))

  const conventions: PresetTypes.PresetFolders = {
    '.': presetDeny({
      ...Object.fromEntries(internals.map((specifier) => [specifier, 'Import the backend through its client entry.'])),
      ...(servers.length > 0 ? { '**/services/*.service': 'Import the client or rsc service file, not a server service.' } : {}),
    }),
    [at('components')]: presetDeny(entries),
    [at('routes')]: presetDeny(entries),
    [at('routes/handlers')]: { deny: { imports: { ...clients, ...Object.fromEntries(Object.keys(entries).map((entry) => [entry, false])) } } },
  }

  return Object.fromEntries(Object.entries(conventions).filter(([path]) => path === '.' || exists(path)))
}

export function presetDetect(root: string, folders: PresetTypes.PresetFolders): PresetTypes.PresetFolders {
  const manifest = presetManifest(root, '.')
  const workspaces = Array.isArray(manifest.workspaces) ? manifest.workspaces : (manifest.workspaces?.packages ?? [])

  const directories = workspaces
    .flatMap((pattern) => (pattern.endsWith('/*') ? presetDirectories(root, pattern.slice(0, -2)) : [pattern]))
    .filter((directory) => existsSync(resolve(root, directory, 'package.json')))

  const detected: PresetTypes.PresetFolders = Object.fromEntries(
    directories.map((directory) => [directory, presetRecipe(root, directory, !directory.startsWith('packages/'))]),
  )

  if (directories.length === 0) {
    const recipe = presetRecipe(root, '.', true)

    if (recipe !== presetRecipes.library) {
      detected['.'] = recipe
    }
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

  const units = Object.entries(merged).filter(([key]) => !key.includes('*'))
  const servers = units.filter(([, value]) => value instanceof Object && Boolean(value.backend)).map(([key]) => presetManifest(root, key))
  const internals = servers.flatMap((server) => Object.keys(server.imports ?? {}).map((specifier) => specifier.replace(/\*$/, '**')))

  const add = (key: string, folder: boolean | PresetTypes.PresetFolder) => {
    merged[key] = key in merged ? presetMerge(folder, merged[key]) : folder
  }

  for (const [key, value] of units) {
    if (!(value instanceof Object)) {
      continue
    }

    if (value.backend) {
      for (const [path, folder] of Object.entries(presetBackendConventions(root, key, presetManifest(root, key)))) {
        add(path === '.' ? key : posix.join(key, path), folder)
      }
    } else if (value.tanstack || value.next) {
      for (const [path, folder] of Object.entries(presetWebConventions(root, key, servers))) {
        add(path === '.' ? key : posix.join(key, path), folder)
      }
    } else if ((value.kit || key.startsWith('packages/')) && !value.expo) {
      const own = Object.keys(presetManifest(root, key).imports ?? {}).map((specifier) => specifier.replace(/\*$/, '**'))
      const message = PresetConstants.presetPackageImports['../../apps/**']
      const appImports = internals.filter((specifier) => !own.includes(specifier)).map((specifier) => [specifier, message])

      add(key, presetDeny({ ...PresetConstants.presetPackageImports, ...Object.fromEntries(appImports) }))
    }
  }

  return merged
}

export function presetStylesheet(root: string, directory: string): string | undefined {
  const found: string[] = []
  const queue = [directory]

  while (queue.length > 0) {
    const folder = queue.shift() ?? directory

    for (const child of readdirSync(resolve(root, folder), { withFileTypes: true })) {
      const path = posix.join(folder, child.name)

      if (child.isDirectory() && !child.name.startsWith('.') && !PresetConstants.presetDetectSkip.includes(child.name) && path.split('/').length < 8) {
        queue.push(path)
      } else if (child.isFile() && child.name.endsWith('.css') && /@import\s+["']tailwindcss|@tailwind\s/.test(readFileSync(resolve(root, path), 'utf8'))) {
        found.push(path)
      }
    }
  }

  const rank = (path: string) => {
    const index = PresetConstants.presetStylesheetNames.indexOf(posix.basename(path, '.css'))

    return index === -1 ? PresetConstants.presetStylesheetNames.length : index
  }

  return found.toSorted((left, right) => rank(left) - rank(right) || left.length - right.length).at(0)
}
