import type { ESTree } from '@oxlint/plugins'

export type DillonAntiSlopTypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion

export type DillonAntiSlopSignature =
  | ESTree.ArrowFunctionExpression
  | ESTree.Function
  | ESTree.TSCallSignatureDeclaration
  | ESTree.TSConstructSignatureDeclaration
  | ESTree.TSConstructorType
  | ESTree.TSFunctionType
  | ESTree.TSMethodSignature

export interface DillonAntiSlopAliasResolution {
  readonly aliases: ReadonlyMap<string, ESTree.TSTypeAliasDeclaration>
  readonly keyword: 'TSObjectKeyword' | 'TSUnknownKeyword'
  readonly shadowed: ReadonlySet<string>
  readonly unions: boolean
  readonly promises: boolean
}

export type DillonAntiSlopTestFramework = 'vi' | 'jest'

export interface DillonAntiSlopDeniedApi {
  api: string
  message?: string
}

export interface DillonAntiSlopModuleMockingOptions {
  deny?: (string | DillonAntiSlopDeniedApi)[]
  allow?: string[]
  checkDestructured?: boolean
}

export interface DillonAntiSlopRuntimeTypeofOptions {
  allowInTypeGuards?: boolean
}

export type DillonAntiSlopSubstitutions = ReadonlyMap<string, ESTree.TSType>

export interface DillonAntiSlopResolvedType {
  readonly type: ESTree.TSType
  readonly substitutions: DillonAntiSlopSubstitutions
}

export interface DillonAntiSlopAliasStep extends DillonAntiSlopResolvedType {
  readonly resolving: ReadonlySet<string>
}

export interface DillonAntiSlopNamedReference {
  readonly reference: ESTree.TSTypeReference
  readonly name: string
  readonly transparent: boolean
  readonly argument: ESTree.TSType | undefined
}

export type DillonAntiSlopUnsafeValue = 'any' | 'empty-object' | 'object' | 'union' | 'unknown'

export type DillonAntiSlopWideningTargetKind =
  | 'anonymous object'
  | 'generic container'
  | 'object'
  | 'open dictionary'
  | 'unknown'

export interface DillonAntiSlopWideningTarget {
  readonly kind: DillonAntiSlopWideningTargetKind
}

export interface DillonAntiSlopTypeEnvironment {
  readonly aliases: ReadonlyMap<string, ESTree.TSTypeAliasDeclaration>
  readonly interfaces: ReadonlyMap<string, readonly ESTree.TSInterfaceDeclaration[]>
  readonly shadowedBuiltIns: ReadonlySet<string>
}

export type DillonAntiSlopBroadTypeKind = 'top' | 'object' | 'record'

export interface DillonAntiSlopKnownValueEvidence {
  readonly type: ESTree.TSType | null
}

export interface DillonAntiSlopConstBinding {
  readonly declarator: ESTree.VariableDeclarator
  readonly init: ESTree.Expression
}
