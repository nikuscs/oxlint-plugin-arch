import { resolveVariable } from './resolve-variable.ts'
import type * as DillonAntiSlopTypes from '../../../types/dillon-anti-slop.types.ts'
import type * as PluginsTypes from '@oxlint/plugins'

const arrayReturningMethods = new Set(['map', 'filter', 'flatMap', 'slice', 'concat', 'toSorted', 'toReversed', 'toSpliced'])

export function arrayMethodIsWrapper(node: PluginsTypes.ESTree.Node): node is
  | PluginsTypes.ESTree.ParenthesizedExpression
  | PluginsTypes.ESTree.ChainExpression
  | PluginsTypes.ESTree.TSAsExpression
  | PluginsTypes.ESTree.TSTypeAssertion
  | PluginsTypes.ESTree.TSNonNullExpression
  | PluginsTypes.ESTree.TSSatisfiesExpression {
  return (
    node.type === 'ParenthesizedExpression' ||
    node.type === 'ChainExpression' ||
    node.type === 'TSAsExpression' ||
    node.type === 'TSTypeAssertion' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'TSSatisfiesExpression'
  )
}

export function arrayMethodUnwrap(node: PluginsTypes.ESTree.Expression): PluginsTypes.ESTree.Expression {
  let current = node

  while (arrayMethodIsWrapper(current)) {
    current = current.expression
  }

  return current
}

export function arrayMethodBinding(sourceCode: PluginsTypes.SourceCode, node: PluginsTypes.ESTree.Expression): PluginsTypes.Variable | null {
  const unwrapped = arrayMethodUnwrap(node)

  return unwrapped.type === 'Identifier' ? resolveVariable(sourceCode, unwrapped) : null
}

export function arrayMethodTarget(node: PluginsTypes.ESTree.Expression): DillonAntiSlopTypes.DillonAntiSlopArrayMethod | null {
  const unwrapped = arrayMethodUnwrap(node)

  if (unwrapped.type !== 'MemberExpression') {
    return null
  }

  const { property } = unwrapped

  if (!unwrapped.computed && property.type === 'Identifier') {
    return { name: property.name, object: unwrapped.object }
  }

  if (unwrapped.computed && property.type === 'Literal' && typeof property.value === 'string') {
    return { name: property.value, object: unwrapped.object }
  }

  return null
}

function isArrayAnnotation(sourceCode: PluginsTypes.SourceCode, type: PluginsTypes.ESTree.TSType): boolean {
  if (type.type === 'TSArrayType' || type.type === 'TSTupleType') {
    return true
  }

  if (type.type === 'TSParenthesizedType' || (type.type === 'TSTypeOperator' && type.operator === 'readonly')) {
    return isArrayAnnotation(sourceCode, type.typeAnnotation)
  }

  return (
    type.type === 'TSTypeReference' &&
    type.typeName.type === 'Identifier' &&
    (type.typeName.name === 'Array' || type.typeName.name === 'ReadonlyArray') &&
    !resolveVariable(sourceCode, type.typeName)?.defs.length
  )
}

export function arrayMethodConstInit(variable: PluginsTypes.Variable): PluginsTypes.ESTree.Expression | null {
  for (const definition of variable.defs) {
    const { node } = definition

    if (
      definition.type === 'Variable' &&
      node.type === 'VariableDeclarator' &&
      node.id.type === 'Identifier' &&
      node.init !== null &&
      node.parent.type === 'VariableDeclaration' &&
      node.parent.kind === 'const'
    ) {
      return node.init
    }
  }

  return null
}

export function arrayMethodIsReassigned(variable: PluginsTypes.Variable): boolean {
  return variable.references.some((reference) => reference.isWrite() && !reference.init)
}

export function arrayMethodIsKnownArray(
  sourceCode: PluginsTypes.SourceCode,
  node: PluginsTypes.ESTree.Expression,
  visited = new Set<PluginsTypes.Variable>(),
): boolean {
  const unwrapped = arrayMethodUnwrap(node)

  if (unwrapped.type === 'ArrayExpression') {
    return true
  }

  if (unwrapped.type === 'CallExpression') {
    const method = arrayMethodTarget(unwrapped.callee)

    return method !== null && arrayReturningMethods.has(method.name) && arrayMethodIsKnownArray(sourceCode, method.object, visited)
  }

  const variable = arrayMethodBinding(sourceCode, unwrapped)

  if (variable === null || visited.has(variable)) {
    return false
  }
  visited.add(variable)

  if (arrayMethodIsReassigned(variable)) {
    return false
  }

  for (const identifier of variable.identifiers) {
    const annotation = 'typeAnnotation' in identifier ? identifier.typeAnnotation?.typeAnnotation : undefined

    if (annotation !== undefined) {
      return isArrayAnnotation(sourceCode, annotation)
    }
  }

  const init = arrayMethodConstInit(variable)

  return init !== null && arrayMethodIsKnownArray(sourceCode, init, visited)
}
