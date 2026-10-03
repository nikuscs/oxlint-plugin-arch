import { resolve, posix } from 'node:path'
import type { PresetOptions, PresetContext } from '../types/preset.types.ts'
import { presetScopes, presetPackageName } from '../utils/helpers/preset.ts'
import {
  presetExtensions,
  presetGeneratedFiles,
} from '../constants/preset.constants.ts'

export function presetResolveContext(options: PresetOptions): PresetContext {
  const generated = presetGeneratedFiles
  const root = resolve(options.root ?? process.cwd())
  const architecture = {
    web: 'apps/web',
    server: 'apps/server',
    scripts: 'scripts',
    packages: 'packages',
    ...options.architecture,
  }
  const web = architecture.web ? [posix.join(architecture.web, 'src')] : []
  const backend = [architecture.server, architecture.runner].flatMap((path) =>
    path ? [posix.join(path, 'src')] : [],
  )
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
  const hooks = presetScopes(web, 'hooks/*.ts')
  const level = options.level ?? 'error'
  const publicEntrypoints =
    options.publicEntrypoints ??
    [architecture.server, architecture.runner].flatMap((directory) => {
      const name = directory ? presetPackageName(root, directory) : undefined
      return name ? [`${name}/client`] : []
    })
  const baseImports = [
    {
      group: ['zod/v4', 'zod/v4/**'],
      message: 'Import from zod, not its transition entry point.',
    },
  ]
  const css =
    options.tailwind === false || !web.length
      ? undefined
      : resolve(
          root,
          options.tailwind?.entryPoint ?? `${web[0]}/application/styles.css`,
        )
  return {
    options,
    root,
    architecture,
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
