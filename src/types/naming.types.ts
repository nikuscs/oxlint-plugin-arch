import type { DeclarationsKind } from './declarations.types.ts'
import type { OptionsPattern } from './options.types.ts'

export type NamingStemMode = 'before-first-dot' | 'full-basename'

export interface NamingDeclarationsOptions {
  kinds?: DeclarationsKind[]
  pattern?: OptionsPattern
  flags?: string
  stem?: NamingStemMode
  trailingRoles?: string[]
  roleSeparators?: string[]
  normalize?: 'remove-separators' | 'none'
  singularize?: 'none' | 'trailing-s'
  allowPattern?: OptionsPattern
}

export interface NamingExportPatternOptions {
  pattern: OptionsPattern
  flags?: string
  ignoreTypeExports?: boolean
  allDeclarations?: boolean
  allowPattern?: OptionsPattern
}

export interface NamingExportPrefixOptions {
  stem?: NamingStemMode
  trailingRoles?: string[]
  roleSeparators?: string[]
  normalize?: 'remove-separators' | 'none'
  singularize?: 'none' | 'trailing-s'
  serviceMethods?: boolean
  allFunctions?: boolean
  allDeclarations?: boolean
  allowPattern?: OptionsPattern
}

export interface NamingExportTemplateOptions {
  file: string
  export: string
  mode?: 'all' | 'some'
  placeholderPattern?: string
  camelCase?: boolean
  allDeclarations?: boolean
}

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
