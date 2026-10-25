import type { OptionsPattern } from './options.types.ts'
import type { ESTree } from '@oxlint/plugins'

export interface FilesComponentsOnlyOptions {
  matchFileName?: boolean
  trailingRoles?: string[]
  allowTypeExports?: boolean
  denyTypePattern?: OptionsPattern
}

export interface FilesConstantsOnlyOptions {
  allowFunctionValues?: boolean
  allowTypeExports?: boolean
  allowReExports?: boolean
}

export interface FilesConstantsOnlyBinding {
  kind: 'const' | 'type' | 'import' | 'function' | 'class' | 'other'
  value?: ESTree.Expression | null
}

export interface FilesDomainConstantsOptions {
  allowServiceMethods?: boolean
  includeData?: boolean
}

export interface FilesExportsOptions {
  names: string[]
  patterns?: string[]
  domainStem?: 'before-first-dot' | 'full-basename'
  trailingRoles?: string[]
  roleSeparators?: string[]
  allowTypeExports?: boolean
}

export interface FilesFactoryOptions {
  factory: string
  allDeclarations?: boolean
}

export interface FilesFactoryKeySet {
  factoryPattern: OptionsPattern
  keys: string[]
  requireKeys?: string[]
}

export interface FilesFactoryKeysOptions {
  keys?: string[]
  factoryPattern?: OptionsPattern
  requireKeys?: string[]
  keySets?: FilesFactoryKeySet[]
}

export interface FilesFactoryKeysCompiled {
  patterns: RegExp[]
  allowed: Set<string>
  allowedList: string[]
  requireKeys: string[]
}

export interface FilesHelpersOptions {
  allowPattern?: OptionsPattern
  detectComponents?: boolean
  message?: string
  hookPattern?: OptionsPattern
}

export interface FilesNoFunctionsOptions {
  banReExports: boolean
  allowPattern?: OptionsPattern
}

export interface FilesRestrictedOptions {
  message: string
}

export interface FilesRouteOptions {
  exportName: string
  allowedExports?: string[]
  inspectExports?: boolean
  bannedHooks: string[]
  banIntrinsicJsx: boolean
}

export type FilesTypesOnlyAllow = 'class' | 'default' | 'enum' | 'function' | 'variable'

export interface FilesTypesOnlyOptions {
  allow?: FilesTypesOnlyAllow[]
  runtimeImports?: 'allow' | 'ban'
  allowImportSources?: string[]
  banReExports?: boolean
}

export interface FilesTypesOnlyImport {
  node: ESTree.Node
  source: string
  locals: string[]
}
