import type { DeclarationsKind } from './declarations.types.ts'
import type { OptionsPattern } from './options.types.ts'

export type NamingStemMode = 'before-first-dot' | 'full-basename'

export interface NamingExportsStem {
  stem?: NamingStemMode
  trailingRoles?: string[]
  roleSeparators?: string[]
  normalize?: 'remove-separators' | 'none'
  singularize?: 'none' | 'trailing-s'
}

export interface NamingDeclarationsOptions extends NamingExportsStem {
  kinds?: DeclarationsKind[]
  pattern?: OptionsPattern
  flags?: string
  allowPattern?: OptionsPattern
}

interface NamingExportsBase {
  scope?: 'exports' | 'functions' | 'declarations'
  ignoreTypeExports?: boolean
  serviceMethods?: boolean
  allowPattern?: OptionsPattern
}

export interface NamingExportsPrefixOptions extends NamingExportsBase, NamingExportsStem {
  mode?: 'prefix'
}

export interface NamingExportsPatternOptions extends NamingExportsBase {
  mode: 'pattern'
  pattern: OptionsPattern
  flags?: string
}

export interface NamingExportsTemplateOptions extends NamingExportsBase {
  mode: 'template'
  file: string
  export: string
  match?: 'all' | 'some'
  placeholderPattern?: string
  camelCase?: boolean
}

export type NamingExportsOptions = NamingExportsPrefixOptions | NamingExportsPatternOptions | NamingExportsTemplateOptions

export interface NamingFileOptions {
  pattern: OptionsPattern
  message: string
  flags?: string
}

export interface NamingFolderOptions {
  singularize?: 'none' | 'trailing-s'
  separators?: string[]
  stripPrefixes?: string[]
  after?: string
}
