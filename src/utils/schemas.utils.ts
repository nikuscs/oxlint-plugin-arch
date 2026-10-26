import { astCallName } from './ast.utils.ts'
import type { ESTree } from '@oxlint/plugins'

export const schemasElementOptionsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    namespaces: { type: 'array', items: { type: 'string' } },
    methods: { type: 'array', items: { type: 'string' } },
    structural: { type: 'array', items: { type: 'string' } },
    scalars: { type: 'boolean' },
  },
}

export const schemasElementDefaults = {
  namespaces: ['z'],
  methods: ['array', 'union', 'record', 'tuple'],
  scalars: true,
}

export function schemasIsCall(node: ESTree.CallExpression, namespaces: ReadonlySet<string>): boolean {
  return (
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    namespaces.has(node.callee.object.name)
  )
}

export function schemasElements(node: ESTree.CallExpression): ESTree.Argument[] {
  return node.arguments.flatMap((argument) =>
    argument.type === 'ArrayExpression'
      ? argument.elements.filter((element): element is Exclude<ESTree.ArrayExpressionElement, null> => element !== null)
      : [argument],
  )
}

export function schemasIsAllowedElement(
  node: ESTree.Argument,
  allowScalars: boolean,
  namespaces: ReadonlySet<string>,
  structuralMethods: ReadonlySet<string>,
): boolean {
  if (node.type === 'Identifier') {
    return true
  }

  if (!allowScalars || node.type !== 'CallExpression' || !schemasIsCall(node, namespaces)) {
    return false
  }

  const name = astCallName(node)
  return Boolean(name && !structuralMethods.has(name))
}
