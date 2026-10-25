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
export type PresetFramework = 'tanstack-start' | 'next'
export interface PresetArchitectureEntry {
  role: PresetRole
  layout?: Record<string, PresetFolderLayout>
  framework?: PresetFramework
  sourceDir?: string
}
export type PresetArchitecture = Record<string, PresetRole | PresetArchitectureEntry>
export interface PresetResolvedRoot {
  role: PresetRole
  layout: Record<string, PresetFolderLayout>
  framework?: PresetFramework
  sourceDir?: string
}
export interface PresetFolderScope {
  path: string
  folder: string
  mode: PresetFolderLayout
}

export interface PresetOptions {
  root?: string
  framework?: PresetFramework
  architecture?: PresetArchitecture
  severity?: 'error' | 'warn'
  ruleSeverities?: Record<string, 'error' | 'warn' | 'off'>
  formatting?: PresetFormattingOptions
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
  next?: PresetNextOptions
  tailwind?: false | PresetTailwindOptions
  shadcn?: false | PresetShadcnOptions
}

export type PresetPolicyOptions = Partial<Record<PresetPolicyName, PresetPolicy>>

export interface PresetFormattingOptions {
  semi?: 'always' | 'never'
  quotes?: 'single' | 'double'
}

export interface PresetLimitsOptions {
  maxFileLines?: number
  maxTypeFileLines?: number
  maxFunctionComplexity?: number
}

export interface PresetModulesOptions {
  customFileRoles?: string[]
  migrationFiles?: string[]
  colocatedTypeFiles?: string[]
}

export interface PresetTestsOptions {
  profile?: 'standard' | 'fixtures'
  additionalTestFunctions?: string[]
  additionalAssertionFunctions?: string[]
  mocking?: PresetTestMockingPreset | PresetTestMockingOptions
}

export type PresetTestMockingPreset = 'modules' | 'strict'

export interface PresetTestMockingApi {
  api: string
  message?: string
}

export interface PresetTestMockingException {
  files: string[]
  apis: string[]
}

export interface PresetTestMockingOptions {
  preset?: PresetTestMockingPreset
  deny?: (string | PresetTestMockingApi)[]
  allow?: PresetTestMockingException[]
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

export interface PresetNextOptions {
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
  ui?: string
  components?: string[]
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
  tanstackWeb: string[]
  nextWeb: string[]
  backend: string[]
  backendRoots: string[]
  packageSources: string[]
  serviceRoots: string[]
  app: string[]
  appFiles: string[]
  webFiles: string[]
  reactFiles: string[]
  backendFiles: string[]
  services: string[]
  utilities: string[]
  types: string[]
  uiRoots: string[]
  webUiRoots: string[]
  ui: string[]
  generated: string[]
  testFiles: string[]
  safetyFiles: string[]
  components: string[]
  hooks: string[]
  publicEntrypoints: string[]
}

export type PresetRootEntry = readonly [string, PresetResolvedRoot]

export type PresetConfiguredRoot = [string, PresetArchitecture[string] | null]

export type PresetJsPlugins = NonNullable<OxlintConfig['jsPlugins']>
export type PresetSettings = NonNullable<OxlintConfig['settings']>
