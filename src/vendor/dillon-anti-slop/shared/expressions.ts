import type { DillonAntiSlopTypeAssertion } from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

export function expressionsUnwrapParentheses(expression: ESTree.Expression): ESTree.Expression {
  let current = expression

  while (current.type === 'ParenthesizedExpression') {
    current = current.expression
  }

  return current
}

export function expressionsIsAssertion(node: ESTree.Node): node is DillonAntiSlopTypeAssertion {
  return node.type === 'TSAsExpression' || node.type === 'TSTypeAssertion'
}

export function expressionsIsConstAssertion(node: DillonAntiSlopTypeAssertion): boolean {
  return (
    node.typeAnnotation.type === 'TSTypeReference' &&
    node.typeAnnotation.typeName.type === 'Identifier' &&
    node.typeAnnotation.typeName.name === 'const'
  )
}
