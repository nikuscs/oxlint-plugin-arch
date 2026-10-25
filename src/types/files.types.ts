import type { NamingExportsStem } from './naming.types.ts'
import type { OptionsPattern } from './options.types.ts'
import type { ESTree } from '@oxlint/plugins'

export interface FilesComponentsOnlyOptions {
  filename?: boolean
  roles?: string[]
  types?: boolean
  deny?: OptionsPattern
}

export interface FilesConstantsOnlyOptions {
  functions?: boolean
  types?: boolean
  reexports?: boolean
}

export interface FilesConstantsOnlyBinding {
  kind: 'const' | 'type' | 'import' | 'function' | 'class' | 'other'
  value?: ESTree.Expression | null
}

export interface FilesDomainConstantsOptions {
  services?: boolean
  data?: boolean
}

export interface FilesExportsOptions extends Pick<NamingExportsStem, 'stem' | 'roles' | 'separators'> {
  names?: string[]
  patterns?: string[]
  types?: boolean
  factory?: string
  scope?: 'exports' | 'declarations'
}

export interface FilesFactoryKeySet {
  factory: OptionsPattern
  keys: string[]
  required?: string[]
}

export interface FilesFactoryKeysOptions {
  keys?: string[]
  factory?: OptionsPattern
  required?: string[]
  sets?: FilesFactoryKeySet[]
}

export interface FilesFactoryKeysCompiled {
  patterns: RegExp[]
  allowed: Set<string>
  allowedList: string[]
  required: string[]
}

export interface FilesHelpersOptions {
  allow?: OptionsPattern
  components?: boolean
  message?: string
  hooks?: OptionsPattern
}

export interface FilesNoFunctionsOptions {
  reexports: boolean
  allow?: OptionsPattern
}

export interface FilesRestrictedOptions {
  message: string
}

export interface FilesRouteOptions {
  export: string
  exports: string[]
  inspect: boolean
  hooks: string[]
  intrinsic: boolean
}

export type FilesTypesOnlyAllow = 'class' | 'default' | 'enum' | 'function' | 'variable'

export interface FilesTypesOnlyOptions {
  allow?: FilesTypesOnlyAllow[]
  imports?: 'allow' | 'ban'
  sources?: string[]
  reexports?: boolean
}

export interface FilesTypesOnlyImport {
  node: ESTree.Node
  source: string
  locals: string[]
}

export interface FilesExternalsOptions {
  packages?: string[]
}

export interface FilesExternalsManifest {
  dependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}
