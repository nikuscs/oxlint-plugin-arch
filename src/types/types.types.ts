import type { OptionsPattern } from './options.types.ts'
import type { ESTree } from '@oxlint/plugins'

export interface TypesDeclarationsOptions {
  allow?: OptionsPattern
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
  min?: number
}

export interface TypesNamespaceImportOptions {
  max: number
  names: Record<string, string>
}
