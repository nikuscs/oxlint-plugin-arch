import { astMemberName } from './ast.utils.ts'
import type { ESTree } from '@oxlint/plugins'

export const schemasElementOptionsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    namespaces: { type: 'array', items: { type: 'string' } },
    methods: { type: 'array', items: { type: 'string' } },
    structuralMethods: { type: 'array', items: { type: 'string' } },
    allowZodScalars: { type: 'boolean' },
  },
}

export const schemasElementDefaults = {
  namespaces: ['z'],
  methods: ['array', 'union', 'record', 'tuple'],
  allowZodScalars: true,
}

function schemasRootName(node: ESTree.MemberExpression): string | undefined {
  if (node.object.type === 'Identifier') {
    return node.object.name
  }
  return node.object.type === 'MemberExpression' ? schemasRootName(node.object) : undefined
}

function schemasIsPackage(source: string, packages: ReadonlySet<string>): boolean {
  return packages.has(source) || [...packages].some((name) => source.startsWith(`${name}/`))
}

export function schemasIsCall(node: ESTree.CallExpression, namespaces: ReadonlySet<string>): boolean {
  return (
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    namespaces.has(node.callee.object.name)
  )
}

export function schemasRuntimeImportLocals(node: ESTree.ImportDeclaration): string[] {
  return node.importKind === 'type'
    ? []
    : node.specifiers.flatMap((specifier) => (specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type' ? [specifier.local.name] : []))
}

export function schemasIsRuntimeImport(node: ESTree.ImportDeclaration, packages: ReadonlySet<string>): boolean {
  return (
    schemasIsPackage(node.source.value, packages) &&
    (node.specifiers.length === 0 ? node.importKind !== 'type' : schemasRuntimeImportLocals(node).length > 0)
  )
}

export function schemasIsRuntimeReexport(
  node: ESTree.ExportNamedDeclaration | ESTree.ExportAllDeclaration,
  packages: ReadonlySet<string>,
): boolean {
  if (!node.source || !schemasIsPackage(node.source.value, packages) || node.exportKind === 'type') {
    return false
  }
  return (
    node.type === 'ExportAllDeclaration' ||
    node.specifiers.length === 0 ||
    node.specifiers.some((specifier) => specifier.exportKind !== 'type')
  )
}

export function schemasIsConstruction(node: ESTree.CallExpression, constructors: ReadonlySet<string>): boolean {
  if (node.callee.type === 'Identifier') {
    return constructors.has(node.callee.name)
  }

  if (node.callee.type !== 'MemberExpression') {
    return false
  }

  const root = schemasRootName(node.callee)
  return Boolean(root && constructors.has(root))
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

  const name = node.callee.type === 'MemberExpression' ? astMemberName(node.callee) : undefined
  return Boolean(name && !structuralMethods.has(name))
}

export function schemasTypeOperator(
  node: ESTree.TSTypeReference,
  namespaces: ReadonlySet<string>,
  operators: ReadonlySet<string>,
): string | undefined {
  return node.typeName.type === 'TSQualifiedName' &&
    node.typeName.left.type === 'Identifier' &&
    namespaces.has(node.typeName.left.name) &&
    operators.has(node.typeName.right.name)
    ? node.typeName.right.name
    : undefined
}
