import { astStaticMemberName } from './ast.ts'
import type { ESTree } from '@oxlint/plugins'

export function schemasIsCall(node: ESTree.CallExpression, namespaces: Set<string>): boolean {
  return node.callee.type === 'MemberExpression' && node.callee.object.type === 'Identifier' && namespaces.has(node.callee.object.name)
}

export function schemasElements(node: ESTree.CallExpression): ESTree.Argument[] {
  return node.arguments.flatMap((argument) => argument.type === 'ArrayExpression'
    ? argument.elements.filter((element): element is Exclude<ESTree.ArrayExpressionElement, null> => element !== null)
    : [argument])
}

export function schemasIsAllowedElement(node: ESTree.Argument, allowScalars: boolean, namespaces: Set<string>, structuralMethods: Set<string>): boolean {
  if (node.type === 'Identifier') {
    return true
  }

  if (!allowScalars || node.type !== 'CallExpression' || !schemasIsCall(node, namespaces)) {
    return false
  }

  const name = node.callee.type === 'MemberExpression' ? astStaticMemberName(node.callee) : undefined
  return Boolean(name && !structuralMethods.has(name))
}

export function schemasTypeOperator(node: ESTree.TSTypeReference, namespaces: Set<string>, operators: Set<string>): string | undefined {
  return node.typeName.type === 'TSQualifiedName' && node.typeName.left.type === 'Identifier'
    && namespaces.has(node.typeName.left.name) && operators.has(node.typeName.right.name)
    ? node.typeName.right.name
    : undefined
}
