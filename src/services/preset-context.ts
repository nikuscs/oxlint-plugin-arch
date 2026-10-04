import { resolve, posix } from 'node:path'
import type { PresetOptions, PresetContext, PresetArchitecture, PresetResolvedRoot } from '../types/preset.types.ts'
import { presetScopes, presetPackageName } from '../utils/helpers/preset.ts'
import {
  presetExtensions,
  presetGeneratedFiles,
} from '../constants/preset.constants.ts'

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
    if (!entry || typeof entry !== 'object') throw new Error('Architecture entries must be roles or role/layout objects.')
    if (Object.keys(entry).some((key) => !['role', 'layout'].includes(key))) throw new Error('Unknown architecture entry option.')
    const role = entry.role
    const portable = path.replaceAll('\\', '/')
    if (!portable.trim() || posix.isAbsolute(portable) || /^[a-z]:/i.test(portable)) throw new Error('Architecture roots must be nonempty project-relative paths.')
    const normalized = posix.normalize(portable).replace(/\/$/, '')
    if (normalized === '..' || normalized.startsWith('../')) throw new Error('Architecture roots must stay inside the project.')
    if (!['web', 'server', 'runner', 'scripts', 'packages'].includes(role)) throw new Error(`Unknown architecture role: ${role}`)
    if (entry.layout !== undefined && (!entry.layout || typeof entry.layout !== 'object' || Array.isArray(entry.layout))) throw new Error('Folder layout must be a path-to-mode object.')
    const layout: PresetResolvedRoot['layout'] = role === 'web' ? { services: 'domain', hooks: 'flat' } : role === 'server' || role === 'runner' ? { services: 'domain' } : {}
    for (const [folder, mode] of Object.entries(entry.layout ?? {})) {
      if (folder.split("/").some((segment) => !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(segment))) throw new Error('Layout folders must be literal source-relative paths without escapes, globs or empty segments.')
      if (mode !== 'flat' && mode !== 'domain') throw new Error('Folder layout mode must be flat or domain.')
      layout[folder] = mode
    }
    const folders = Object.keys(layout)
    if (folders.some((folder, index) => folders.slice(0, index).some((other) => folder.startsWith(other + '/') || other.startsWith(folder + '/')))) throw new Error('Layout folders must not overlap.')
    return [normalized, { role, layout }] as const
  })
  for (const [index, [path]] of entries.entries()) {
    if (entries.slice(0, index).some(([other]) => other === path || other === '.' || path === '.' || other.startsWith(`${path}/`) || path.startsWith(`${other}/`))) throw new Error('Architecture roots must not overlap.')
  }
  const architecture: Record<string, PresetResolvedRoot> = Object.fromEntries(entries)
  if (options.fileRoles?.some((role) => !/^[a-z][a-z0-9-]*$/.test(role))) throw new Error('File roles must be lowercase kebab-case names.')
  if (options.fileRoles?.some((role) => ['service', 'client', 'server', 'rsc', 'utils', 'action', 'query', 'types', 'constants', 'handler', 'test', 'spec'].includes(role))) throw new Error('File roles must not replace built-in roles.')
  const web = entries.filter(([, { role }]) => role === 'web').map(([path]) => posix.join(path, 'src'))
  const backendRoots = entries.filter(([, { role }]) => role === 'server' || role === 'runner').map(([path]) => path)
  const backend = backendRoots.map((path) => posix.join(path, 'src'))
  const packages = entries.filter(([, { role }]) => role === 'packages').map(([path]) => path)
  const scripts = entries.filter(([, { role }]) => role === 'scripts').map(([path]) => path)
  const folders = entries.flatMap(([path, entry]) => Object.entries(entry.layout).map(([folder, mode]) => ({
    path: posix.join(path, ['web', 'server', 'runner'].includes(entry.role) ? 'src' : '', folder), folder, mode,
  })))
  const rpcClients = entries.filter(([, entry]) => entry.role === 'web').map(([path, entry]) => posix.join(path, 'src/services', entry.layout.services === 'domain' ? 'rpc/rpc.client.ts' : 'rpc.client.ts'))
  const app = [...web, ...backend]
  const appFiles = presetScopes(app)
  const webFiles = presetScopes(web)
  const backendFiles = presetScopes(backend)
  const services = presetScopes(app, `services/**/${presetExtensions}`)
  const utilities = ['**/*.utils.ts', '**/*.constants.ts', '**/*.types.ts']
  const types = presetScopes(app, 'types/**')
  const ui = presetScopes(web, 'components/ui/**')
  const testFiles = [
    '**/{test,tests,e2e}/**/*.{ts,tsx,mts,cts}',
    '**/*.{test,spec}.{ts,tsx,mts,cts}',
  ]
  const safetyFiles = [...appFiles, ...testFiles]
  const components = presetScopes(web, 'components/**/*.tsx')
  const hooks = presetScopes(web, 'hooks/**/*.ts')
  const level = options.level ?? 'error'
  const publicEntrypoints =
    options.publicEntrypoints ??
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
  const entryPoints = Object.fromEntries(Object.entries(tailwind === false ? {} : tailwind?.entryPoints ?? {}).map(([path, entry]) => [
    posix.normalize(path.replaceAll('\\', '/')).replace(/\/$/, ''),
    entry,
  ]))
  const css = tailwind === false ? {} : Object.fromEntries(web.map((path) => [
    path,
    resolve(root, entryPoints[posix.dirname(path)] ?? tailwind?.entryPoint ?? `${path}/application/styles.css`),
  ]))
  return {
    options,
    root,
    architecture,
    folders,
    rpcClients,
    packages,
    scripts,
    web,
    backend,
    app,
    appFiles,
    webFiles,
    backendFiles,
    services,
    utilities,
    types,
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
