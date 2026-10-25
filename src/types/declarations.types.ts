import type { AstFunction } from './ast.types.ts'
import type { ESTree } from '@oxlint/plugins'

export type DeclarationsKind = 'function' | 'const' | 'let' | 'var' | 'class' | 'type' | 'interface' | 'enum'

export type DeclarationsRuntime = ESTree.VariableDeclaration | ESTree.Function | ESTree.Class | ESTree.TSEnumDeclaration

export interface DeclarationsNamed {
  name: string
  node: ESTree.Node
  kind?: DeclarationsKind
}

export interface DeclarationsFunction {
  name: string
  node: AstFunction
}

export interface DeclarationsCandidate {
  name: string
  node: ESTree.Node
  declaration?: ESTree.Declaration
  initializer?: ESTree.Expression | null
  typeOnly?: boolean
}
