import { astStaticMemberName } from './ast.ts'
import type { ESTree } from '@oxlint/plugins'

export function orpcFindChainCall(expression: ESTree.Expression, method: string): ESTree.CallExpression | undefined {
  if (expression.type === 'CallExpression') {
    if (expression.callee.type === 'MemberExpression' && astStaticMemberName(expression.callee) === method) {
      return expression
    }

    if (expression.callee.type === 'MemberExpression') {
      return orpcFindChainCall(expression.callee.object, method)
    }
  }

  if (expression.type === 'MemberExpression') {
    return orpcFindChainCall(expression.object, method)
  }

  if (expression.type === 'ChainExpression') {
    return orpcFindChainCall(expression.expression, method)
  }
}

export function orpcIsNamedOrComposedArgument(argument: ESTree.Argument | undefined, composers: Set<string>): boolean {
  if (argument?.type === 'Identifier') {
    return true
  }

  return argument?.type === 'CallExpression' && argument.callee.type === 'Identifier'
    && composers.has(argument.callee.name) && argument.arguments[0]?.type === 'Identifier'
}
