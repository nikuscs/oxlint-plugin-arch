import type { DeclarationsKind } from './declarations.types.ts'
import type { OptionsPattern } from './options.types.ts'

export type NamingStemMode = 'before-first-dot' | 'full-basename'

export type NamingPrefixSource = 'file' | 'folder' | 'parent'

export interface NamingExportsStem {
  stem?: NamingStemMode
  roles?: string[]
  separators?: string[]
  normalize?: 'remove-separators' | 'none'
  singularize?: 'none' | 'trailing-s'
  prefix?: NamingPrefixSource[]
}

export interface NamingCaptureOptions extends Pick<NamingExportsStem, 'roles' | 'separators' | 'singularize'> {
  stem?: NamingStemMode | 'folder'
  file?: string
  placeholder?: string
}

export interface NamingDeclarationsOptions extends NamingExportsStem {
  kinds?: DeclarationsKind[]
  pattern?: OptionsPattern
  flags?: string
  allow?: OptionsPattern
}

interface NamingExportsBase {
  scope?: 'exports' | 'functions' | 'declarations'
  types?: boolean
  services?: boolean
  allow?: OptionsPattern
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
  export: string | string[]
  match?: 'all' | 'some'
  placeholder?: string
  camelCase?: boolean
}

export type NamingExportsOptions = NamingExportsPrefixOptions | NamingExportsPatternOptions | NamingExportsTemplateOptions

export interface NamingFileOptions {
  pattern?: OptionsPattern
  message: string
  flags?: string
  unique?: string
  template?: OptionsPattern
  placeholder?: string
}

export interface NamingFolderOptions {
  singularize?: 'none' | 'trailing-s'
  separators?: string[]
  prefixes?: string[]
  after?: string
}

export interface NamingTypesOptions {
  pattern?: OptionsPattern
  message?: string
}

export interface NamingDeclarationsCheck {
  kinds: Set<DeclarationsKind> | null
  allowed: RegExp[]
  expected: RegExp[]
  prefixes: string[]
  label: string
  normalize: NamingExportsStem['normalize']
}

export interface NamingImportsEntry {
  source: string
  name: string | string[] | false
  namespace?: boolean
  drop?: OptionsPattern
  placeholder?: string
}

export interface NamingImportsOptions extends Pick<NamingCaptureOptions, 'file'> {
  imports: NamingImportsEntry[]
}

export interface NamingImportsCompiled {
  pattern: RegExp
  names: string[]
  namespace: boolean
  drop: RegExp[]
}

export interface NamingLabelsEntry {
  callee: OptionsPattern
  property?: string
  name?: OptionsPattern
  pattern?: OptionsPattern
  drop?: OptionsPattern
  loose?: boolean
  within?: OptionsPattern
}

export interface NamingLabelsOptions extends Pick<NamingCaptureOptions, 'file' | 'placeholder'> {
  labels: NamingLabelsEntry[]
}

export interface NamingLabelsCompiled {
  callees: RegExp[]
  entry: NamingLabelsEntry
  drop: RegExp[]
  patterns: string[]
  within: RegExp[]
}

export interface NamingKeysOptions {
  callees?: string[]
  exports?: OptionsPattern
  name?: OptionsPattern
  keys?: OptionsPattern
  inline?: boolean
  delegate?: boolean
  allow?: OptionsPattern
  singularize?: 'none' | 'trailing-s'
}

export interface NamingPairsEntry {
  methods: [string, string]
  strip?: OptionsPattern
  allow?: OptionsPattern
}

export interface NamingPairsOptions {
  pairs: NamingPairsEntry[]
}
