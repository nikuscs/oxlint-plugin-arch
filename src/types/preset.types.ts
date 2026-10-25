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
  /** Web roots only: selects the route and runtime-boundary policies. */
  framework?: PresetFramework
  /** Web, server and runner roots only: the source folder inside the root; `src` when omitted, `.` for the root itself. */
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
  /** Default framework for web roots that do not set their own; `tanstack-start` when omitted. */
  framework?: PresetFramework
  architecture?: PresetArchitecture
  severity?: 'error' | 'warn'
  /** Per-rule levels applied after `severity`, for rules the preset enables. */
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

export interface PresetPolicyOptions extends Partial<Record<PresetPolicyName, PresetPolicy>> {}

export interface PresetFormattingOptions {
  semi?: 'always' | 'never'
  quotes?: 'single' | 'double'
}

export interface PresetLimitsOptions {
  maxFileLines?: number
  /** `max-lines` for `*.types.ts` files; defaults to 1000. */
  maxTypeFileLines?: number
  maxFunctionComplexity?: number
}

export interface PresetModulesOptions {
  customFileRoles?: string[]
  migrationFiles?: string[]
  /** Type files allowed outside `types/`; they follow the backend `types/` contract. */
  colocatedTypeFiles?: string[]
}

export interface PresetTestsOptions {
  profile?: 'standard' | 'fixtures'
  additionalTestFunctions?: string[]
  additionalAssertionFunctions?: string[]
  /** Test-double APIs banned in test files; `modules` (module mocking only) when omitted. */
  mocking?: PresetTestMockingPreset | PresetTestMockingOptions
}

export type PresetTestMockingPreset = 'modules' | 'strict'

export interface PresetTestMockingApi {
  api: string
  message?: string
}

export interface PresetTestMockingException {
  files: string[]
  /** API patterns allowed in these files; `*` allows every API. */
  apis: string[]
}

export interface PresetTestMockingOptions {
  preset?: PresetTestMockingPreset
  /** API patterns added to the preset list, such as `vi.*` or `jest.spyOn`. */
  deny?: Array<string | PresetTestMockingApi>
  /** Per-file exceptions, added after the preset's own. */
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
  /** The components.json `ui` alias: a workspace package name or a tsconfig `paths` alias. It also sets the UI kit files. */
  ui?: string
  /** Import sources treated as components, like the components.json `components` alias. */
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
  /** Web `src` roots per framework. */
  tanstackWeb: string[]
  nextWeb: string[]
  backend: string[]
  /** Server and runner architecture roots, without their source folder. */
  backendRoots: string[]
  /** Source folders of packages roots: `src` of a package, or of each package in a folder of packages. */
  packageSources: string[]
  /** Backend and package source folders, whose services follow the backend contract. */
  serviceRoots: string[]
  app: string[]
  appFiles: string[]
  webFiles: string[]
  /** Web files plus React code in packages: `.tsx` files and the `components` and `hooks` folders. */
  reactFiles: string[]
  backendFiles: string[]
  services: string[]
  utilities: string[]
  types: string[]
  /** UI kit folders resolved from `shadcn.ui`. */
  uiRoots: string[]
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
