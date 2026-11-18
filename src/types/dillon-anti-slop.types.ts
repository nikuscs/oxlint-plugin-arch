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

export type DillonAntiSlopTypeBinding =
  | ESTree.Class
  | ESTree.ImportDefaultSpecifier
  | ESTree.ImportNamespaceSpecifier
  | ESTree.ImportSpecifier
  | ESTree.TSEnumDeclaration
  | ESTree.TSInterfaceDeclaration
  | ESTree.TSTypeAliasDeclaration

export interface DillonAntiSlopTypeEnvironment {
  readonly bindingsByName: Map<string, Map<ESTree.Node, DillonAntiSlopTypeBinding | null>>
  readonly visitorKeys: Readonly<Record<string, readonly string[]>>
}

export interface DillonAntiSlopTypeBindingsState {
  environment?: DillonAntiSlopTypeEnvironment
  collect: boolean
}

export type DillonAntiSlopTypeCheck = (environment: DillonAntiSlopTypeEnvironment) => void

export type DillonAntiSlopDefer = (check: DillonAntiSlopTypeCheck) => void

export interface DillonAntiSlopBoundType {
  readonly type: ESTree.TSType
  readonly substitutions: ReadonlyMap<string, DillonAntiSlopBoundType>
  readonly resolving: ReadonlySet<ESTree.TSTypeAliasDeclaration>
}

export interface DillonAntiSlopBoundReference {
  readonly bound: DillonAntiSlopBoundType
  readonly reference: ESTree.TSTypeReference
  readonly name: string
}

export type DillonAntiSlopTypeMatcher = (type: ESTree.TSType, matches: (child: ESTree.TSType) => boolean) => boolean

export type DillonAntiSlopBroadTypeKind = 'top' | 'object' | 'record'

export interface DillonAntiSlopKnownValueEvidence {
  readonly type: ESTree.TSType | null
}

export interface DillonAntiSlopConstBinding {
  readonly declarator: ESTree.VariableDeclarator
  readonly init: ESTree.Expression
}

export interface DillonAntiSlopArrayMethod {
  readonly name: string
  readonly object: ESTree.Expression
}

export interface DillonAntiSlopReducer {
  readonly accumulator: ESTree.BindingIdentifier
  readonly callback: ESTree.ArrowFunctionExpression | ESTree.Function
  readonly initialValue: ESTree.Argument | undefined
}

export interface DillonAntiSlopSymbolNamesOptions {
  terms?: string[]
}

export interface DillonAntiSlopSafetyCommentOptions {
  comment?: string
}
