import type { OptionsPattern } from './options.types.ts'
import type { ESTree } from '@oxlint/plugins'

export interface TypesDeclarationsOptions {
  allowPattern?: OptionsPattern
}

export type TypesDeclarationNode = ESTree.TSTypeAliasDeclaration | ESTree.TSInterfaceDeclaration

export interface TypesImportedBinding {
  name: string
  source: string
}

export interface TypesInlineOptions {
  parameters?: boolean
  returns?: boolean
  functionTypes?: boolean
  minMembers?: number
}

export interface TypesNamespaceImportOptions {
  max: number
  names: Record<string, string>
}

export interface TypesNamespaceEdit {
  range: [number, number]
  text: string
}

export interface TypesNamespaceCandidate {
  node: ESTree.ImportDeclaration
  name: string
  reason: string
}
