import type { OxlintConfig, OxlintOverride } from 'oxlint'

export type PresetPolicy = boolean | ((current: OxlintOverride[]) => OxlintOverride[])
export type PresetPolicyName =
  | 'typePlacement'
  | 'typeSafety'
  | 'serviceStructure'
  | 'fileLayout'
  | 'naming'
  | 'comments'
  | 'formatting'
  | 'statementLayout'
  | 'imports'
  | 'react'
  | 'effects'
  | 'memoization'
  | 'routes'
  | 'forms'
  | 'schemas'
  | 'boundaries'
  | 'tests'
  | 'trivialFunctions'
  | 'mutableState'
  | 'backend'
  | 'tailwind'
  | 'shadcn'
  | 'rpcClientOwnership'

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

export interface PresetOptions {
  root?: string
  architecture?: PresetArchitecture
  severity?: 'error' | 'warn'
  limits?: PresetLimitsOptions
  modules?: PresetModulesOptions
  imports?: PresetImportsOptions
  orpc?: PresetOrpcOptions
  sql?: PresetSqlOptions
  forms?: PresetFormsOptions
  react?: PresetReactOptions
  tests?: PresetTestsOptions
  policies?: PresetPolicyOptions
  ignorePatterns?: string[]
  ruleExclusions?: Record<string, string[]>
  cliFiles?: string[]
  tanstackStart?: PresetTanstackStartOptions
  tailwind?: false | PresetTailwindOptions
  shadcn?: false | PresetShadcnOptions
}

export interface PresetPolicyOptions extends Partial<Record<PresetPolicyName, PresetPolicy>> {}

export interface PresetLimitsOptions {
  maxFileLines?: number
  maxFunctionComplexity?: number
}

export interface PresetModulesOptions {
  customFileRoles?: string[]
  migrationFiles?: string[]
}

export interface PresetTestsOptions {
  profile?: 'standard' | 'fixtures'
  additionalTestFunctions?: string[]
  additionalAssertionFunctions?: string[]
}

export interface PresetImportsOptions {
  backendEntryPoints?: string[]
  aliases?: Record<string, string>
  internalSortPatterns?: string[]
}

export interface PresetOrpcOptions {
  publicProcedureFiles?: string[]
  outputSchemaComposers?: string[]
  clientOwnerFile?: string
}

export interface PresetSqlOptions {
  likeSanitizers?: string[]
}

export interface PresetFormsOptions {
  schemaResolver?: string
}

export interface PresetReactOptions {
  compiler?: boolean
  componentProps?: boolean
}

export interface PresetTanstackStartOptions {
  additionalServerOnlyImports?: string[]
  additionalClientOnlyImports?: string[]
  computedImportAllowedFiles?: string[]
}

export interface PresetTailwindOptions {
  cssEntryPoint?: string
  cssEntryPointsByRoot?: Record<string, string>
  rootFontSize?: number
}

export interface PresetShadcnOptions {
  uiImportPath?: string
  componentImportSources?: string[]
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
