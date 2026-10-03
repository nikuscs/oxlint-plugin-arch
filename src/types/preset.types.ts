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

export interface PresetArchitecture {
  web?: string | false
  server?: string | false
  runner?: string | false
  scripts?: string | false
  packages?: string | false
}

export interface PresetOptions extends Partial<
  Record<PresetPolicyName, PresetPolicy>
> {
  root?: string
  architecture?: PresetArchitecture
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
  schemaComposers?: string[]
  sanitizers?: string[]
  formResolver?: string
  cli?: string[]
}

export interface PresetTailwindOptions {
  entryPoint?: string
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
  architecture: PresetArchitecture
  root: string
  level: 'error' | 'warn'
  css: string | undefined
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
