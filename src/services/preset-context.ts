import { existsSync, readdirSync } from 'node:fs'
import { resolve, posix } from 'node:path'
import type { PresetOptions, PresetContext, PresetArchitecture, PresetResolvedRoot } from '../types/preset.types.ts'
import { presetScopes, presetPackageName, presetTsconfigAliasTargets } from '../utils/helpers/preset.ts'
import { presetExtensions, presetGeneratedFiles } from '../constants/preset.constants.ts'

export function presetResolveContext(options: PresetOptions): PresetContext {
  const generated = presetGeneratedFiles
  const root = resolve(options.root ?? process.cwd())
  const configured: PresetArchitecture = options.architecture ?? {
    'apps/web': 'web',
    'apps/server': 'server',
    scripts: 'scripts',
    packages: 'packages',
  }
  const entries = Object.entries(configured).map(([path, configuredRoot]) => {
    const entry = typeof configuredRoot === 'string' ? { role: configuredRoot } : configuredRoot
    if (!entry || typeof entry !== 'object')
      throw new Error('Architecture entries must be roles or role/layout objects.')
    if (Object.keys(entry).some((key) => !['role', 'layout', 'framework', 'sourceDir'].includes(key)))
      throw new Error('Unknown architecture entry option.')
    const role = entry.role
    if ('framework' in entry && entry.framework !== undefined && role !== 'web')
      throw new Error('Only web architecture roots accept a framework.')
    const framework = role === 'web' ? (entry.framework ?? options.framework ?? 'tanstack-start') : undefined
    if (framework !== undefined && framework !== 'tanstack-start' && framework !== 'next')
      throw new Error(`Unknown framework: ${framework}`)
    const sourced = role === 'web' || role === 'server' || role === 'runner'
    if ('sourceDir' in entry && entry.sourceDir !== undefined && !sourced)
      throw new Error('Only web, server and runner architecture roots accept a sourceDir.')
    const sourceDir = entry.sourceDir ?? 'src'
    if (
      typeof sourceDir !== 'string' ||
      (sourceDir !== '.' && sourceDir.split('/').some((segment) => !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(segment)))
    )
      throw new Error('Source folders must be `.` or literal root-relative paths without escapes, globs or empty segments.')
    const portable = path.replaceAll('\\', '/')
    if (!portable.trim() || posix.isAbsolute(portable) || /^[a-z]:/i.test(portable))
      throw new Error('Architecture roots must be nonempty project-relative paths.')
    const normalized = posix.normalize(portable).replace(/\/$/, '')
    if (normalized === '..' || normalized.startsWith('../'))
      throw new Error('Architecture roots must stay inside the project.')
    if (!['web', 'server', 'runner', 'scripts', 'packages'].includes(role))
      throw new Error(`Unknown architecture role: ${role}`)
    if (
      entry.layout !== undefined &&
      (!entry.layout || typeof entry.layout !== 'object' || Array.isArray(entry.layout))
    )
      throw new Error('Folder layout must be a path-to-mode object.')
    const layout: PresetResolvedRoot['layout'] = {}
    if (role !== 'scripts') {
      layout.services = 'domain'
    }
    if (role === 'web') {
      layout.hooks = 'flat'
    }
    for (const [folder, mode] of Object.entries(entry.layout ?? {})) {
      if (folder.split('/').some((segment) => !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(segment)))
        throw new Error(
          'Layout folders must be literal source-relative paths without escapes, globs or empty segments.',
        )
      if (mode !== 'flat' && mode !== 'domain') throw new Error('Folder layout mode must be flat or domain.')
      layout[folder] = mode
    }
    const folders = Object.keys(layout)
    for (const [index, folder] of folders.entries()) {
      const overlaps = folders
        .slice(0, index)
        .some((other) => folder.startsWith(other + '/') || other.startsWith(folder + '/'))
      if (overlaps) {
        throw new Error('Layout folders must not overlap.')
      }
    }
    return [
      normalized,
      {
        role,
        layout,
        ...(framework ? { framework } : {}),
        ...(entry.sourceDir === undefined ? {} : { sourceDir }),
      },
    ] as const
  })
  for (const [index, [path]] of entries.entries()) {
    const overlaps = entries
      .slice(0, index)
      .some(
        ([other]) =>
          other === path ||
          other === '.' ||
          path === '.' ||
          other.startsWith(path + '/') ||
          path.startsWith(other + '/'),
      )
    if (overlaps) {
      throw new Error('Architecture roots must not overlap.')
    }
  }
  const architecture: Record<string, PresetResolvedRoot> = Object.fromEntries(entries)
  if (options.modules?.customFileRoles?.some((role) => !/^[a-z][a-z0-9-]*$/.test(role)))
    throw new Error('File roles must be lowercase kebab-case names.')
  if (
    options.modules?.customFileRoles?.some((role) =>
      [
        'service',
        'client',
        'server',
        'rsc',
        'utils',
        'action',
        'query',
        'types',
        'constants',
        'handler',
        'test',
        'spec',
      ].includes(role),
    )
  )
    throw new Error('File roles must not replace built-in roles.')
  if (options.framework !== undefined && options.framework !== 'tanstack-start' && options.framework !== 'next')
    throw new Error(`Unknown framework: ${options.framework}`)
  const source = (path: string, entry: PresetResolvedRoot) => posix.join(path, entry.sourceDir ?? 'src')
  // A packages root is one package when it has a manifest, otherwise a folder of packages.
  const isPackage = (path: string) => existsSync(resolve(root, path, 'package.json'))
  const packageSource = (path: string) => posix.join(path, isPackage(path) ? 'src' : '*/src')
  const web = entries.filter(([, { role }]) => role === 'web').map(([path, entry]) => source(path, entry))
  const webFor = (framework: 'tanstack-start' | 'next') =>
    entries.filter(([, entry]) => entry.framework === framework).map(([path, entry]) => source(path, entry))
  const tanstackWeb = webFor('tanstack-start')
  const nextWeb = webFor('next')
  const backendEntries = entries.filter(([, { role }]) => role === 'server' || role === 'runner')
  const backendRoots = backendEntries.map(([path]) => path)
  const backend = backendEntries.map(([path, entry]) => source(path, entry))
  const packages = entries.filter(([, { role }]) => role === 'packages').map(([path]) => path)
  const packageSources = packages.map(packageSource)
  const serviceRoots = [...backend, ...packageSources]
  const scripts = entries.filter(([, { role }]) => role === 'scripts').map(([path]) => path)
  const folders = entries.flatMap(([path, entry]) =>
    Object.entries(entry.layout).map(([folder, mode]) => ({
      path: posix.join(
        entry.role === 'scripts' ? path : entry.role === 'packages' ? packageSource(path) : source(path, entry),
        folder,
      ),
      folder,
      mode,
    })),
  )
  const rpcClients = entries
    .filter(([, entry]) => entry.role === 'web')
    .map(([path, entry]) =>
      posix.join(source(path, entry), 'services', entry.layout.services === 'domain' ? 'rpc/rpc.client.ts' : 'rpc.client.ts'),
    )
  const app = [...web, ...backend, ...packageSources]
  const appFiles = presetScopes(app)
  const webFiles = presetScopes(web)
  const reactFiles = [
    ...webFiles,
    ...presetScopes(packageSources, '**/*.tsx'),
    ...presetScopes(packageSources, `components/**/${presetExtensions}`),
    ...presetScopes(packageSources, `hooks/**/${presetExtensions}`),
  ]
  const backendFiles = presetScopes(backend)
  const services = presetScopes(app, `services/**/${presetExtensions}`)
  const utilities = ['**/*.utils.ts', '**/*.constants.ts', '**/*.types.ts']
  const types = presetScopes(app, 'types/**')
  // The kit is the workspace package named `value`, or the folders a tsconfig `paths` alias maps it to.
  const resolveUi = (value: string): string[] => {
    if (typeof value !== 'string' || !value) throw new Error('shadcn.ui must be a nonempty import path.')
    const manifests = entries.flatMap(([path, entry]) => {
      const children =
        entry.role === 'packages' && existsSync(resolve(root, path)) && !isPackage(path)
          ? readdirSync(resolve(root, path), { withFileTypes: true })
              .filter((child) => child.isDirectory() && isPackage(posix.join(path, child.name)))
              .map((child) => ({ directory: posix.join(path, child.name), sources: posix.join(path, child.name, 'src') }))
          : []
      const sources = ['web', 'server', 'runner'].includes(entry.role) ? source(path, entry) : posix.join(path, 'src')
      return [{ directory: path, sources }, ...children]
    })
    const named = manifests.filter(({ directory }) => presetPackageName(root, directory) === value)
    if (named.length) return named.map(({ sources }) => sources)
    const aliased = [...new Set(['.', ...manifests.map(({ directory }) => directory)].flatMap((directory) =>
      presetTsconfigAliasTargets(root, directory, value),
    ))]
    if (aliased.length) return aliased
    throw new Error(`shadcn.ui ${JSON.stringify(value)} matches no workspace package name or existing tsconfig paths alias target.`)
  }
  const shadcn = options.shadcn || {}
  if ('uiImportPath' in shadcn) throw new Error('shadcn.uiImportPath was renamed to shadcn.ui.')
  if ('componentImportSources' in shadcn) throw new Error('shadcn.componentImportSources was renamed to shadcn.components.')
  const uiRoots = shadcn.ui === undefined ? web.map((path) => posix.join(path, 'components/ui')) : resolveUi(shadcn.ui)
  const ui = presetScopes(uiRoots, '**')
  // Kit folders inside a web source keep the web-only shadcn and context exceptions and that root's Tailwind theme.
  const webUiRoots = uiRoots.filter((path) => web.some((webRoot) => webRoot === '.' || path === webRoot || path.startsWith(webRoot + '/')))
  const testFiles = ['**/{test,tests,e2e}/**/*.{ts,tsx,mts,cts}', '**/*.{test,spec}.{ts,tsx,mts,cts}']
  const safetyFiles = [...appFiles, ...testFiles]
  const components = presetScopes([...web, ...packageSources], 'components/**/*.tsx')
  const hooks = presetScopes([...web, ...packageSources], 'hooks/**/*.ts')
  const level = options.severity ?? 'error'
  const publicEntrypoints =
    options.imports?.backendEntryPoints ??
    backendRoots.flatMap((directory) => {
      const name = presetPackageName(root, directory)
      return name ? [`${name}/client`] : []
    })
  const baseImports = [
    {
      group: ['zod/v4', 'zod/v4/**'],
      message: 'Import from zod, not its transition entry point.',
    },
  ]
  const tailwind = options.tailwind
  const entryPoints = Object.fromEntries(
    Object.entries(tailwind === false ? {} : (tailwind?.cssEntryPointsByRoot ?? {})).map(([path, entry]) => [
      posix.normalize(path.replaceAll('\\', '/')).replace(/\/$/, ''),
      entry,
    ]),
  )
  const webCss: Record<string, string> =
    tailwind === false
      ? {}
      : Object.fromEntries(
          entries
            .filter(([, entry]) => entry.role === 'web')
            .map(([path, entry]) => {
              const sourcePath = source(path, entry)
              const fallback = entry.framework === 'next' ? 'app/globals.css' : 'application/styles.css'
              return [
                sourcePath,
                resolve(root, entryPoints[path] ?? tailwind?.cssEntryPoint ?? posix.join(sourcePath, fallback)),
              ]
            }),
        )
  // A kit outside every web root uses its package's entry, or the one stylesheet all web roots share.
  const webStylesheets = [...new Set(Object.values(webCss))]
  const kitCss = Object.fromEntries(
    (tailwind === false ? [] : uiRoots.filter((path) => !webUiRoots.includes(path))).map((path) => {
      const owners = packages.flatMap((packageRoot) => {
        if (path !== packageRoot && !path.startsWith(packageRoot + '/')) return []
        const child = path.slice(packageRoot.length + 1).split('/')[0]
        return isPackage(packageRoot) || !child ? [packageRoot] : [posix.join(packageRoot, child), packageRoot]
      })
      const entry = owners.map((owner) => entryPoints[owner]).find(Boolean)
      if (entry) return [path, resolve(root, entry)]
      if (webStylesheets.length === 1) return [path, webStylesheets[0]]
      throw new Error(
        `The UI kit ${path} needs a Tailwind stylesheet: set tailwind.cssEntryPointsByRoot for ${owners[0] ?? path}.`,
      )
    }),
  )
  const css = { ...webCss, ...kitCss }
  return {
    options,
    root,
    architecture,
    folders,
    rpcClients,
    packages,
    scripts,
    web,
    tanstackWeb,
    nextWeb,
    backend,
    backendRoots,
    packageSources,
    serviceRoots,
    app,
    appFiles,
    webFiles,
    reactFiles,
    backendFiles,
    services,
    utilities,
    types,
    uiRoots,
    webUiRoots,
    ui,
    generated,
    testFiles,
    safetyFiles,
    components,
    hooks,
    level,
    publicEntrypoints,
    baseImports,
    css,
  }
}
