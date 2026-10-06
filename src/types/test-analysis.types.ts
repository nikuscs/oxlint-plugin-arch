import type { ESTree } from '@oxlint/plugins'
import type { AstRuntimeFunction } from '../utils/helpers/ast.ts'

export interface TestRegistration {
  call: ESTree.CallExpression
  callback: AstRuntimeFunction
  table?: ESTree.Expression
}

export interface TestTableRow {
  bindings: Map<ESTree.Node, AstRuntimeFunction>
  callbacks: AstRuntimeFunction[]
}
