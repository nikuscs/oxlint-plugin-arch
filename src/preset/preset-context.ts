import { existsSync, readdirSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import {
  presetBuiltinFileRoles,
  presetDefaultArchitecture,
  presetEntryKeys,
  presetExtensions,
  presetFrameworks,
  presetGeneratedFiles,
  presetLayoutModes,
  presetLiteralSegment,
  presetRoles,
  presetSourcedRoles,
} from './preset.constants.ts'
import { PresetError, presetPackageName, presetScopes, presetTsconfigAliasTargets } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'

function presetIsLiteralPath(path: string): boolean {
  return path.split('/').every((segment) => presetLiteralSegment.test(segment))
}

function presetNormalizePath(path: string): string {
  return posix.normalize(path.replaceAll('\\', '/')).replace(/\/$/, '')
}

function presetIsWithin(path: string, parent: string): boolean {
  return path.startsWith(`${parent}/`)
}

function presetAssertDisjoint(paths: string[], message: string): void {
  const overlaps = paths.some((path, index) =>
    paths.slice(0, index).some((other) => {
      const nested = presetIsWithin(path, other) || presetIsWithin(other, path)
      return path === other || path === '.' || other === '.' || nested
    }),
  )

  if (overlaps) {
    throw new PresetError(message)
  }
}

function presetSourceDir([path, entry]: PresetTypes.PresetRootEntry): string {
  return posix.join(path, entry.sourceDir ?? 'src')
}

function presetIsPackage(root: string, path: string): boolean {
  return existsSync(resolve(root, path, 'package.json'))
}

function presetPackageSource(root: string, path: string): string {
  return posix.join(path, presetIsPackage(root, path) ? 'src' : '*/src')
}

function presetResolveLayout(
  role: PresetTypes.PresetRole,
  layout: PresetTypes.PresetArchitectureEntry['layout'] | null,
): PresetTypes.PresetResolvedRoot['layout'] {
  if (layout !== undefined && (!layout || typeof layout !== 'object' || Array.isArray(layout))) {
    throw new PresetError('Folder layout must be a path-to-mode object.')
  }

  const resolved: PresetTypes.PresetResolvedRoot['layout'] = {}

  if (role !== 'scripts') {
    resolved.services = 'domain'
  }

  if (role === 'web') {
    resolved.hooks = 'flat'
  }

  for (const [folder, mode] of Object.entries(layout ?? {})) {
    if (!presetIsLiteralPath(folder)) {
      throw new PresetError(
        'Layout folders must be literal source-relative paths without escapes, globs or empty segments.',
      )
    }

    if (!presetLayoutModes.includes(mode)) {
      throw new PresetError('Folder layout mode must be flat or domain.')
    }
    resolved[folder] = mode
  }
  presetAssertDisjoint(Object.keys(resolved), 'Layout folders must not overlap.')

  return resolved
}

export function presetResolveContext(options: PresetTypes.PresetOptions): PresetTypes.PresetContext {
  const root = resolve(options.root ?? process.cwd())
  const architecture = options.architecture ?? presetDefaultArchitecture

  const configuredRoots: PresetTypes.PresetConfiguredRoot[] = Object.entries(architecture)

  const entries = configuredRoots.map((configuredRoot): PresetTypes.PresetRootEntry => {
    const [path, configured] = configuredRoot

    const entry: PresetTypes.PresetArchitectureEntry | null =
      typeof configured === 'string' ? { role: configured } : configured

    if (!entry || typeof entry !== 'object') {
      throw new PresetError('Architecture entries must be roles or role/layout objects.')
    }

    if (Object.keys(entry).some((key) => !presetEntryKeys.includes(key))) {
      throw new PresetError('Unknown architecture entry option.')
    }

    const { role } = entry

    if (entry.framework !== undefined && role !== 'web') {
      throw new PresetError('Only web architecture roots accept a framework.')
    }

    const framework = role === 'web' ? (entry.framework ?? options.framework ?? 'tanstack-start') : undefined

    if (framework !== undefined && !presetFrameworks.includes(framework)) {
      throw new PresetError(`Unknown framework: ${framework}`)
    }

    if (entry.sourceDir !== undefined && !presetSourcedRoles.includes(role)) {
      throw new PresetError('Only web, server and runner architecture roots accept a sourceDir.')
    }

    const sourceDir = entry.sourceDir ?? 'src'

    if (typeof sourceDir !== 'string' || (sourceDir !== '.' && !presetIsLiteralPath(sourceDir))) {
      throw new PresetError(
        'Source folders must be `.` or literal root-relative paths without escapes, globs or empty segments.',
      )
    }

    const portable = path.replaceAll('\\', '/')

    if (!portable.trim() || posix.isAbsolute(portable) || /^[a-z]:/i.test(portable)) {
      throw new PresetError('Architecture roots must be nonempty project-relative paths.')
    }

    const normalized = presetNormalizePath(portable)

    if (normalized === '..' || normalized.startsWith('../')) {
      throw new PresetError('Architecture roots must stay inside the project.')
    }

    if (!presetRoles.includes(role)) {
      throw new PresetError(`Unknown architecture role: ${role}`)
    }

    const resolved: PresetTypes.PresetResolvedRoot = { role, layout: presetResolveLayout(role, entry.layout) }

    if (framework) {
      resolved.framework = framework
    }

    if (entry.sourceDir !== undefined) {
      resolved.sourceDir = sourceDir
    }

    return [normalized, resolved]
  })

  presetAssertDisjoint(
    entries.map(([path]) => path),
    'Architecture roots must not overlap.',
  )
  const fileRoles = options.modules?.customFileRoles ?? []

  if (fileRoles.some((role) => !/^[a-z][a-z0-9-]*$/.test(role))) {
    throw new PresetError('File roles must be lowercase kebab-case names.')
  }

  if (fileRoles.some((role) => presetBuiltinFileRoles.includes(role))) {
    throw new PresetError('File roles must not replace built-in roles.')
  }

  if (options.framework !== undefined && !presetFrameworks.includes(options.framework)) {
    throw new PresetError(`Unknown framework: ${options.framework}`)
  }

  const withRole = (...roles: PresetTypes.PresetRole[]) => entries.filter(([, entry]) => roles.includes(entry.role))
  const webEntries = withRole('web')
  const backendEntries = withRole('server', 'runner')
  const web = webEntries.map(presetSourceDir)
  const backendRoots = backendEntries.map(([path]) => path)
  const backend = backendEntries.map(presetSourceDir)
  const packages = withRole('packages').map(([path]) => path)
  const packageSources = packages.map((path) => presetPackageSource(root, path))
  const app = [...web, ...backend, ...packageSources]
  const appFiles = presetScopes(app)
  const webFiles = presetScopes(web)
  const clientOwner = options.orpc?.clientOwnerFile

  const folders = entries.flatMap((rootEntry) => {
    const [path, { role, layout }] = rootEntry
    let base = presetSourceDir(rootEntry)

    if (role === 'scripts') {
      base = path
    }

    if (role === 'packages') {
      base = presetPackageSource(root, path)
    }

    return Object.entries(layout).map(([folder, mode]) => ({ path: posix.join(base, folder), folder, mode }))
  })

  const rpcClients = clientOwner
    ? [clientOwner]
    : webEntries.map((rootEntry) => {
      const client = rootEntry[1].layout.services === 'domain' ? 'rpc/rpc.client.ts' : 'rpc.client.ts'
      return posix.join(presetSourceDir(rootEntry), 'services', client)
    })

  const { shadcn } = options

  if (shadcn && 'uiImportPath' in shadcn) {
    throw new PresetError('shadcn.uiImportPath was renamed to shadcn.ui.')
  }

  if (shadcn && 'componentImportSources' in shadcn) {
    throw new PresetError('shadcn.componentImportSources was renamed to shadcn.components.')
  }

  const uiImport = shadcn ? shadcn.ui : undefined
  let uiRoots = web.map((path) => posix.join(path, 'components/ui'))

  if (uiImport !== undefined) {
    if (typeof uiImport !== 'string' || !uiImport) {
      throw new PresetError('shadcn.ui must be a nonempty import path.')
    }

    const manifests = entries.flatMap((rootEntry) => {
      const [path, { role }] = rootEntry
      const folder = resolve(root, path)
      const sources = presetSourcedRoles.includes(role) ? presetSourceDir(rootEntry) : posix.join(path, 'src')

      const children =
        role === 'packages' && existsSync(folder) && !presetIsPackage(root, path)
          ? readdirSync(folder, { withFileTypes: true })
            .filter((child) => child.isDirectory() && presetIsPackage(root, posix.join(path, child.name)))
            .map((child) => ({ directory: posix.join(path, child.name), sources: posix.join(path, child.name, 'src') }))
          : []

      return [{ directory: path, sources }, ...children]
    })

    const named = manifests.filter(({ directory }) => presetPackageName(root, directory) === uiImport)
    uiRoots = named.map(({ sources }) => sources)

    if (!uiRoots.length) {
      const directories = ['.', ...manifests.map(({ directory }) => directory)]
      uiRoots = [...new Set(directories.flatMap((directory) => presetTsconfigAliasTargets(root, directory, uiImport)))]
    }

    if (!uiRoots.length) {
      throw new PresetError(
        `shadcn.ui ${JSON.stringify(uiImport)} matches no workspace package name or existing tsconfig paths alias target.`,
      )
    }
  }

  const webUiRoots = uiRoots.filter((path) =>
    web.some((webRoot) => webRoot === '.' || path === webRoot || presetIsWithin(path, webRoot)),
  )

  const tailwind = options.tailwind === false ? undefined : options.tailwind
  const styled = options.tailwind !== false

  const entryPoints = new Map(
    Object.entries(tailwind?.cssEntryPointsByRoot ?? {}).map(([path, entry]) => [presetNormalizePath(path), entry]),
  )

  const webCss = Object.fromEntries(
    (styled ? webEntries : []).map((rootEntry) => {
      const [path, { framework }] = rootEntry
      const sourcePath = presetSourceDir(rootEntry)
      const fallback = posix.join(sourcePath, framework === 'next' ? 'app/globals.css' : 'application/styles.css')
      return [sourcePath, resolve(root, entryPoints.get(path) ?? tailwind?.cssEntryPoint ?? fallback)]
    }),
  )

  const webStylesheets = [...new Set(Object.values(webCss))]

  const kitCss = Object.fromEntries(
    (styled ? uiRoots.filter((path) => !webUiRoots.includes(path)) : []).map((path) => {
      const owners = packages.flatMap((packageRoot) => {
        if (path !== packageRoot && !presetIsWithin(path, packageRoot)) {
          return []
        }

        const child = path.slice(packageRoot.length + 1).split('/')[0]
        const single = presetIsPackage(root, packageRoot) || !child
        return single ? [packageRoot] : [posix.join(packageRoot, child), packageRoot]
      })

      const entry = owners.map((owner) => entryPoints.get(owner)).find(Boolean)

      if (entry) {
        return [path, resolve(root, entry)]
      }

      if (webStylesheets.length === 1) {
        return [path, webStylesheets[0]]
      }
      throw new PresetError(
        `The UI kit ${path} needs a Tailwind stylesheet: set tailwind.cssEntryPointsByRoot for ${owners[0] ?? path}.`,
      )
    }),
  )

  const testFiles = ['**/{test,tests,e2e}/**/*.{ts,tsx,mts,cts}', '**/*.{test,spec}.{ts,tsx,mts,cts}']

  const publicEntrypoints =
    options.imports?.backendEntryPoints ??
    backendRoots.flatMap((directory) => {
      const name = presetPackageName(root, directory)
      return name ? [`${name}/client`] : []
    })

  return {
    options,
    root,
    architecture: Object.fromEntries(entries),
    folders,
    rpcClients,
    packages,
    scripts: withRole('scripts').map(([path]) => path),
    web,
    tanstackWeb: webEntries.filter(([, entry]) => entry.framework === 'tanstack-start').map(presetSourceDir),
    nextWeb: webEntries.filter(([, entry]) => entry.framework === 'next').map(presetSourceDir),
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
      ...presetScopes(packageSources, `components/**/${presetExtensions}`),
      ...presetScopes(packageSources, `hooks/**/${presetExtensions}`),
    ],
    backendFiles: presetScopes(backend),
    services: presetScopes(app, `services/**/${presetExtensions}`),
    utilities: ['**/*.utils.ts', '**/*.constants.ts', '**/*.types.ts'],
    types: presetScopes(app, 'types/**'),
    uiRoots,
    webUiRoots,
    ui: presetScopes(uiRoots, '**'),
    generated: presetGeneratedFiles,
    testFiles,
    safetyFiles: [...appFiles, ...testFiles],
    components: presetScopes([...web, ...packageSources], 'components/**/*.tsx'),
    hooks: presetScopes([...web, ...packageSources], 'hooks/**/*.ts'),
    level: options.severity ?? 'error',
    publicEntrypoints,
    baseImports: [{ group: ['zod/v4', 'zod/v4/**'], message: 'Import from zod, not its transition entry point.' }],
    css: { ...webCss, ...kitCss },
  }
}
