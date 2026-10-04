import type { OxlintConfig, OxlintOverride } from 'oxlint'

export type PresetPolicy =
  boolean | ((current: OxlintOverride[]) => OxlintOverride[])
export type PresetPolicyName =
  | 'banTypes'
  | 'typeSafety'
  | 'serviceModules'
  | 'moduleLayout'
  | 'naming'
  | 'comments'
  | 'formatting'
  | 'layout'
  | 'imports'
  | 'reactRules'
  | 'effects'
  | 'memoization'
  | 'routes'
  | 'forms'
  | 'schemas'
  | 'boundaries'
  | 'tests'
  | 'wrappers'
  | 'mutableState'
  | 'backendRules'
  | 'tailwindRules'
  | 'shadcnRules'
  | 'clientOwnership'

export type PresetRole = 'web' | 'server' | 'runner' | 'scripts' | 'packages'
export type PresetFolderLayout = 'flat' | 'domain'
export interface PresetArchitectureEntry {
  role: PresetRole
  layout?: Record<string, PresetFolderLayout>
}
export type PresetArchitecture = Record<string, PresetRole | PresetArchitectureEntry>
export interface PresetResolvedRoot {
  role: PresetRole
  layout: Record<string, PresetFolderLayout>
}
export interface PresetFolderScope {
  path: string
  folder: string
  mode: PresetFolderLayout
}

export interface PresetOptions extends Partial<
  Record<PresetPolicyName, PresetPolicy>
> {
  root?: string
  architecture?: PresetArchitecture
  fileRoles?: string[]
  level?: 'error' | 'warn'
  complexity?: number
  ignorePatterns?: string[]
  exclude?: Record<string, string[]>
  reactCompiler?: boolean
  tailwind?: false | PresetTailwindOptions
  shadcn?: false | PresetShadcnOptions
  publicApi?: string[]
  publicEntrypoints?: string[]
  internalPatterns?: string[]
  aliases?: Record<string, string>
  rpcClient?: string
  tanstackRuntime?: PresetRuntimeOptions
  schemaComposers?: string[]
  sanitizers?: string[]
  formResolver?: string
  cli?: string[]
}

export interface PresetRuntimeOptions {
  serverImports?: string[]
  clientImports?: string[]
  allowComputedImportsIn?: string[]
}

export interface PresetTailwindOptions {
  entryPoint?: string
  entryPoints?: Record<string, string>
  rootFontSize?: number
}

export interface PresetShadcnOptions {
  ui?: string
  componentImports?: string[]
}

export type PresetRules = NonNullable<OxlintConfig['rules']>
export type PresetPolicies = Partial<Record<PresetPolicyName, OxlintOverride[]>>
export interface PresetManifest {
  name?: string
}

export interface PresetImportRestriction {
  group: string[]
  message: string
}

export interface PresetContext {
  options: PresetOptions
  architecture: Record<string, PresetResolvedRoot>
  folders: PresetFolderScope[]
  rpcClients: string[]
  packages: string[]
  scripts: string[]
  root: string
  level: 'error' | 'warn'
  css: Record<string, string>
  baseImports: PresetImportRestriction[]
  web: string[]
  backend: string[]
  app: string[]
  appFiles: string[]
  webFiles: string[]
  backendFiles: string[]
  services: string[]
  utilities: string[]
  types: string[]
  ui: string[]
  generated: string[]
  testFiles: string[]
  safetyFiles: string[]
  components: string[]
  hooks: string[]
  publicEntrypoints: string[]
}

export type PresetJsPlugins = NonNullable<OxlintConfig['jsPlugins']>
export type PresetSettings = NonNullable<OxlintConfig['settings']>
