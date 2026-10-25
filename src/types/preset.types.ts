import type { OxlintConfig, OxlintOverride } from 'oxlint'

export type PresetLevel = 'error' | 'warn'
export type PresetSwitch = boolean | 'warn'
export type PresetLayoutMode = 'flat' | 'domain'

export interface PresetLayoutOptions {
  services?: PresetLayoutMode | false
  hooks?: PresetLayoutMode | false
  components?: PresetLayoutMode | false
  suffixes?: string[]
}

export interface PresetLimitsOptions {
  lines?: number
  types?: number
  complexity?: number
}

export interface PresetStyleOptions {
  quotes?: 'single' | 'double'
  semicolons?: boolean
  multiline?: boolean
  padding?: boolean
}

export interface PresetBasicsOptions {
  trivial?: boolean
  state?: boolean
  switch?: boolean
  negation?: boolean
}

export interface PresetNamingOptions {
  files?: boolean
  exports?: boolean
  folders?: boolean
}

export interface PresetCommentsOptions {
  directives?: boolean
}

export interface PresetTypesOptions {
  placement?: boolean
  safety?: boolean
  colocated?: string[]
}

export interface PresetImportsOptions {
  sort?: boolean
  boundaries?: boolean
  aliases?: Record<string, string>
  internal?: string[]
}

export interface PresetMockingApi {
  api: string
  message?: string
}

export interface PresetMockingException {
  files: string[]
  apis: string[]
}

export type PresetMockingPreset = 'modules' | 'strict'

export interface PresetMockingOptions {
  preset?: PresetMockingPreset
  deny?: (string | PresetMockingApi)[]
  allow?: PresetMockingException[]
}

export interface PresetTestsOptions {
  assertions?: string[]
  functions?: string[]
  mocking?: PresetMockingPreset | PresetMockingOptions
  titles?: boolean
  fixtures?: boolean
}

export interface PresetReactOptions {
  a11y?: boolean
  effects?: boolean
  memo?: boolean
  props?: boolean
  perf?: boolean
  compiler?: boolean
}

export interface PresetFrameworkOptions {
  server?: string[]
  client?: string[]
  dynamic?: string[]
}

export interface PresetTailwindOptions {
  css?: string
  rem?: number
}

export interface PresetShadcnOptions {
  ui?: string
  components?: string[]
}

export interface PresetBackendOptions {
  services?: boolean
  exports?: string[]
}

export interface PresetOrpcOptions {
  public?: string[]
  composers?: string[]
  client?: string
}

export interface PresetFormsOptions {
  resolver?: string
}

export interface PresetSqlOptions {
  sanitizers?: string[]
}

export interface PresetGroups {
  layout?: PresetSwitch | PresetLayoutOptions
  limits?: PresetSwitch | PresetLimitsOptions
  style?: PresetSwitch | PresetStyleOptions
  basics?: PresetSwitch | PresetBasicsOptions
  naming?: PresetSwitch | PresetNamingOptions
  comments?: PresetSwitch | PresetCommentsOptions
  types?: PresetSwitch | PresetTypesOptions
  imports?: PresetSwitch | PresetImportsOptions
  tests?: PresetSwitch | PresetTestsOptions
  react?: PresetSwitch | PresetReactOptions
  tanstack?: PresetSwitch | PresetFrameworkOptions
  next?: PresetSwitch | PresetFrameworkOptions
  expo?: PresetSwitch | PresetFrameworkOptions
  tailwind?: PresetSwitch | PresetTailwindOptions
  shadcn?: PresetSwitch | PresetShadcnOptions
  kit?: PresetSwitch
  backend?: PresetSwitch | PresetBackendOptions
  orpc?: PresetSwitch | PresetOrpcOptions
  schemas?: PresetSwitch
  forms?: PresetSwitch | PresetFormsOptions
  sql?: PresetSwitch | PresetSqlOptions
  console?: PresetSwitch
}

export type PresetGroupName = keyof PresetGroups

export interface PresetFolder extends PresetGroups {
  severity?: PresetLevel
  source?: string
  rules?: Record<string, PresetLevel | 'off'>
}

export type PresetFolders = Record<string, boolean | PresetFolder>

export interface PresetConfig {
  root?: string
  folders: PresetFolders
}

export type PresetRecipe = PresetGroups

export type PresetRules = NonNullable<OxlintConfig['rules']>
export type PresetJsPlugins = NonNullable<OxlintConfig['jsPlugins']>
export type PresetSettings = NonNullable<OxlintConfig['settings']>

export interface PresetResolvedGroups {
  layout: PresetLayoutOptions & { suffixes: string[] }
  limits: Required<PresetLimitsOptions>
  style: Required<PresetStyleOptions>
  basics: Required<PresetBasicsOptions>
  naming: Required<PresetNamingOptions>
  comments: Required<PresetCommentsOptions>
  types: Required<PresetTypesOptions>
  imports: Omit<Required<PresetImportsOptions>, 'internal'> & Pick<PresetImportsOptions, 'internal'>
  tests: Required<PresetTestsOptions>
  react: Required<Pick<PresetReactOptions, 'a11y' | 'effects' | 'props' | 'compiler'>> & Pick<PresetReactOptions, 'memo' | 'perf'>
  tanstack: Required<PresetFrameworkOptions>
  next: Required<PresetFrameworkOptions>
  expo: Required<PresetFrameworkOptions>
  tailwind: Pick<PresetTailwindOptions, 'css'> & { rem: number }
  shadcn: Required<PresetShadcnOptions>
  kit: PresetEmptyOptions
  backend: PresetBackendOptions
  orpc: PresetOrpcOptions
  schemas: PresetEmptyOptions
  forms: Required<PresetFormsOptions>
  sql: Required<PresetSqlOptions>
  console: PresetEmptyOptions
}

export interface PresetEmptyOptions {
  empty?: never
}

export type PresetGroupSettings<K extends PresetGroupName> = PresetResolvedGroups[K] & { level: PresetLevel }

export type PresetEffective = { [K in PresetGroupName]?: PresetGroupSettings<K> | null }

export type PresetGroupDefaults = { [K in PresetGroupName]: PresetGroupSettings<K> }

export type PresetKind = 'web' | 'backend' | 'library' | 'console'
export type PresetFramework = 'tanstack' | 'next' | 'expo'

export interface PresetScope {
  key: string
  parent: PresetScope | null
  depth: number
  folder: PresetFolder
  effective: PresetEffective
}

export interface PresetUnit {
  key: string
  scope: PresetScope
  kind: PresetKind
  framework?: PresetFramework
  source: string
  layout: Record<string, PresetLayoutMode>
}

export interface PresetLayoutScope {
  path: string
  folder: string
  mode: PresetLayoutMode
}

export interface PresetRuntimeOptions {
  web: string[]
  backend: string[]
  aliases: Record<string, string>
  backendPackages: string[]
  serverImports: string[]
  clientImports: string[]
  allowComputedImportsIn: string[]
  rpcClients?: string[]
}

export interface PresetImportRestriction {
  group: string[]
  message: string
}

export interface PresetManifest {
  name?: string
}

export interface PresetProject {
  root: string
  scopes: PresetScope[]
  units: PresetUnit[]
  suffixes: string[]
  colocated: string[]
  aliases: Record<string, string>
  internal: string[] | undefined
  orpc: Required<PresetOrpcOptions>
  layouts: PresetLayoutScope[]
  rpcClients: string[]
  packages: string[]
  scripts: string[]
  web: string[]
  tanstackWeb: string[]
  nextWeb: string[]
  expoWeb: string[]
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
  baseImports: PresetImportRestriction[]
  css: Record<string, string>
  ignores: string[]
}

export type PresetBuilder<K extends PresetGroupName> = (project: PresetProject, settings: PresetGroupSettings<K>) => OxlintOverride[]

export type PresetBuilders = { [K in PresetGroupName]?: PresetBuilder<K> }
