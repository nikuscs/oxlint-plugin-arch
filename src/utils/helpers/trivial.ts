import type { AstRuntimeFunction } from './ast.ts'
import type { ESTree } from '@oxlint/plugins'

export function trivialExpression(node: AstRuntimeFunction): ESTree.Expression | null {
  if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') {
    return node.body
  }
  if (!node.body || node.body.type !== 'BlockStatement') return null
  const statements = node.body.body.filter((statement) => statement.type !== 'EmptyStatement'
    && !(statement.type === 'ExpressionStatement' && statement.directive))
  if (statements.length !== 1) return null
  const statement = statements[0]
  if (statement.type === 'ReturnStatement') return statement.argument
  return statement.type === 'ExpressionStatement' ? statement.expression : null
}

export function trivialUnwrap(expression: ESTree.Expression): ESTree.Expression {
  if (expression.type === 'ParenthesizedExpression' || expression.type === 'TSAsExpression'
    || expression.type === 'TSSatisfiesExpression' || expression.type === 'TSTypeAssertion'
    || expression.type === 'TSNonNullExpression' || expression.type === 'ChainExpression') {
    return trivialUnwrap(expression.expression)
  }
  return expression.type === 'AwaitExpression' ? trivialUnwrap(expression.argument) : expression
}

export function trivialCallRoot(expression: ESTree.Expression): string | undefined {
  if (expression.type === 'Identifier') return expression.name
  if (expression.type === 'MemberExpression' && !expression.computed && !expression.optional) {
    return trivialCallRoot(expression.object)
  }
  return undefined
}

export function trivialIsForwarder(node: AstRuntimeFunction, expression: ESTree.Expression): boolean {
  const value = trivialUnwrap(expression)
  if (value.type === 'Literal') return !('regex' in value)
  if (value.type === 'TemplateLiteral') return value.expressions.length === 0
  if (value.type === 'Identifier') return true
  if (value.type !== 'CallExpression' || value.optional) return false
  const root = trivialCallRoot(value.callee)
  if (!root || node.params.some((param) => param.type !== 'Identifier')) return false
  const parameters = node.params.flatMap((param) => param.type === 'Identifier' ? [param.name] : [])
  const arguments_ = value.arguments
  const receiver = value.callee.type === 'MemberExpression' ? root : undefined
  const forwarded = parameters.filter((name) => name !== receiver)
  return arguments_.length === forwarded.length && arguments_.every((argument, index) =>
    argument.type === 'Identifier' && argument.name === forwarded[index])
}
