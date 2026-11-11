import type { OptionsPattern } from './options.types.ts'
import type { ESTree } from '@oxlint/plugins'

export interface TypesDeclarationsOptions {
  allow?: OptionsPattern
  modules?: boolean
}

export type TypesDeclarationNode = ESTree.TSTypeAliasDeclaration | ESTree.TSInterfaceDeclaration

export interface TypesImportedBinding {
  name: string
  source: string
}

export interface TypesInlineOptions {
  parameters?: boolean
  returns?: boolean
  functions?: boolean
  variables?: boolean
  assertions?: boolean
  arguments?: boolean
  min?: number
}

export interface TypesServiceOptions {
  suffix?: string
  factory?: string
}

export interface TypesNamespaceImportOptions {
  max: number
  names: Record<string, string>
}

export interface TypesDuplicateOptions {
  structs?: string[]
  min?: number
}
