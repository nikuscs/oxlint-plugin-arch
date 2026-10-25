import type { OptionsPattern } from './options.types.ts'
import type { SourceIndent } from './source.types.ts'
import type { ESTree } from '@oxlint/plugins'

export interface LayoutEdit {
  range: [number, number]
  text: string
}

export interface LayoutCallArgumentsOptions {
  minArguments?: number
  indent?: number
}

export interface LayoutCallArrayOptions {
  callees?: string[]
  minElements?: number
  indent?: SourceIndent
}

export interface LayoutChainGroup {
  minDepth: number
  methods?: string[]
  onlyMethods?: string[]
  rootPattern?: OptionsPattern
}

export interface LayoutChainOptions {
  groups: LayoutChainGroup[]
  indent?: SourceIndent
}

export interface LayoutChainCompiledGroup {
  minDepth: number
  methods?: Set<string>
  onlyMethods?: Set<string>
  rootPatterns: RegExp[]
}

export interface LayoutChainLink {
  call: ESTree.CallExpression
  member: ESTree.MemberExpression
  methodName: string | undefined
}

export interface LayoutJsxAttributesOptions {
  minAttributes?: number
  indent?: SourceIndent
}

export interface LayoutObjectOptions {
  minProperties?: number
  scope?: LayoutObjectScope
  indent?: SourceIndent
}

export type LayoutObjectScope = 'call-args' | 'all'

export interface LayoutPaddingOptions {
  returnMinStatements?: number
  multilineVariables?: boolean
}

export type LayoutPaddingKind = 'variable' | 'block' | 'control' | 'return' | 'other'

export interface LayoutTernaryOptions {
  maxLength?: number
  indent?: number
}
