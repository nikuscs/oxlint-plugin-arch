import { astDottedName, astMemberName, astUnwrap } from './ast.utils.ts'
import { optionsPatternsTest } from './options.utils.ts'
import type { ESTree } from '@oxlint/plugins'

export const effectBuilders = ['Effect.gen', 'Effect.fn', 'Effect.fnUntraced']

export function effectIsBuilder(node: ESTree.Expression | null | undefined, builders: ReadonlySet<string>): node is ESTree.CallExpression {
  const value = node ? astUnwrap(node) : undefined

  if (value?.type !== 'CallExpression') {
    return false
  }

  const callee = value.callee.type === 'CallExpression' ? value.callee.callee : value.callee
  return builders.has(astDottedName(callee) ?? '')
}

export function effectGenerator(node: ESTree.Expression | null | undefined, builders: ReadonlySet<string>): ESTree.Function | undefined {
  const value = node ? astUnwrap(node) : undefined

  return effectIsBuilder(value, builders)
    ? value.arguments.find((argument): argument is ESTree.Function => argument.type === 'FunctionExpression')
    : undefined
}

export function effectMatches(node: ESTree.Expression | ESTree.Super | null | undefined, patterns: RegExp[]): boolean {
  if (!node || node.type === 'Super') {
    return false
  }

  const value = astUnwrap(node)
  const target = value.type === 'CallExpression' ? value.callee : value
  const name = astDottedName(target)

  if (name !== undefined && optionsPatternsTest(patterns, name)) {
    return true
  }

  return value.type === 'CallExpression' && target.type === 'MemberExpression' && astMemberName(target) === 'pipe' && effectMatches(target.object, patterns)
}
