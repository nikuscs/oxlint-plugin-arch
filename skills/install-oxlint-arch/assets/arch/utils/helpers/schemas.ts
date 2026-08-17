import { astStaticMemberName } from './ast.ts'
import type { ESTree } from '@oxlint/plugins'

function schemasIsRuntimeSpecifier(specifier: ESTree.ImportDeclarationSpecifier): boolean {
  return specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type'
}

function schemasMemberRootName(node: ESTree.MemberExpression): string | undefined {
  if (node.object.type === 'Identifier') {
    return node.object.name
  }

  return node.object.type === 'MemberExpression' ? schemasMemberRootName(node.object) : undefined
}

export function schemasIsCall(node: ESTree.CallExpression, namespaces: Set<string>): boolean {
  return node.callee.type === 'MemberExpression' && node.callee.object.type === 'Identifier' && namespaces.has(node.callee.object.name)
}

export function schemasRuntimeImportLocals(node: ESTree.ImportDeclaration): string[] {
  return node.importKind === 'type'
    ? []
    : node.specifiers.flatMap((specifier) => schemasIsRuntimeSpecifier(specifier) ? [specifier.local.name] : [])
}

export function schemasIsRuntimeImport(node: ESTree.ImportDeclaration, packages: ReadonlySet<string>): boolean {
  return packages.has(node.source.value)
    && (node.specifiers.length === 0 ? node.importKind !== 'type' : schemasRuntimeImportLocals(node).length > 0)
}

export function schemasIsConstruction(node: ESTree.CallExpression, constructors: ReadonlySet<string>): boolean {
  if (node.callee.type === 'Identifier') {
    return constructors.has(node.callee.name)
  }

  if (node.callee.type !== 'MemberExpression') {
    return false
  }

  const root = schemasMemberRootName(node.callee)
  return Boolean(root && constructors.has(root))
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
