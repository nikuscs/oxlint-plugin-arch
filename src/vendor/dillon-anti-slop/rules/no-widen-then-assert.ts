import { defineRule } from '@oxlint/plugins'
import { expressionsIsAssertion, expressionsUnwrapParentheses } from '../shared/expressions.ts'
import { resolveVariable } from '../shared/resolve-variable.ts'
import { typeReferenceName } from '../shared/type-reference-name.ts'
import type * as DillonAntiSlopTypes from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree, SourceCode, Variable } from '@oxlint/plugins'

const functionBoundaryTypes = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
  'TSDeclareFunction',
  'TSEmptyBodyFunctionExpression',
])

const definitelyObjectTypes = new Set([
  'TSArrayType',
  'TSConstructorType',
  'TSFunctionType',
  'TSMappedType',
  'TSObjectKeyword',
  'TSTupleType',
])

function unwrapTypeParentheses(type: ESTree.TSType): ESTree.TSType {
  let current = type

  while (current.type === 'TSParenthesizedType') {
    current = current.typeAnnotation
  }

  return current
}

function isUnknownOrAnyType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type)
  return unwrapped.type === 'TSUnknownKeyword' || unwrapped.type === 'TSAnyKeyword'
}

function isBroadRecordKeyType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type)

  if (
    unwrapped.type === 'TSStringKeyword' ||
    unwrapped.type === 'TSNumberKeyword' ||
    unwrapped.type === 'TSSymbolKeyword'
  ) {
    return true
  }

  if (unwrapped.type === 'TSUnionType') {
    return unwrapped.types.every(isBroadRecordKeyType)
  }

  return unwrapped.type === 'TSTypeReference' && typeReferenceName(unwrapped) === 'PropertyKey'
}

function isBroadRecordType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type)

  if (unwrapped.type === 'TSTypeReference') {
    if (typeReferenceName(unwrapped) === 'Readonly') {
      const inner = unwrapped.typeArguments?.params.at(0)
      return inner !== undefined && isBroadRecordType(inner)
    }

    if (typeReferenceName(unwrapped) !== 'Record') {
      return false
    }

    const parameters = unwrapped.typeArguments?.params ?? []
    return parameters.length === 2 && isBroadRecordKeyType(parameters[0]) && isUnknownOrAnyType(parameters[1])
  }

  if (unwrapped.type !== 'TSTypeLiteral' || unwrapped.members.length !== 1) {
    return false
  }

  const [member] = unwrapped.members
  return (
    member.type === 'TSIndexSignature' &&
    member.parameters.length === 1 &&
    isBroadRecordKeyType(member.parameters[0].typeAnnotation.typeAnnotation) &&
    isUnknownOrAnyType(member.typeAnnotation.typeAnnotation)
  )
}

function broadTypeKind(type: ESTree.TSType): DillonAntiSlopTypes.DillonAntiSlopBroadTypeKind | null {
  const unwrapped = unwrapTypeParentheses(type)

  if (unwrapped.type === 'TSUnknownKeyword' || unwrapped.type === 'TSAnyKeyword') {
    return 'top'
  }

  if (unwrapped.type === 'TSObjectKeyword') {
    return 'object'
  }

  return isBroadRecordType(unwrapped) ? 'record' : null
}

function normalizedTypeText(sourceText: string, type: ESTree.TSType): string {
  const unwrapped = unwrapTypeParentheses(type)
  return sourceText.slice(unwrapped.start, unwrapped.end).replaceAll(/\s+/gu, '')
}

function isDefinitelyObjectType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type)

  if (definitelyObjectTypes.has(unwrapped.type)) {
    return true
  }

  if (unwrapped.type === 'TSTypeLiteral') {
    return unwrapped.members.length > 0
  }

  if (unwrapped.type === 'TSIntersectionType') {
    return unwrapped.types.every(isDefinitelyObjectType)
  }

  return (
    unwrapped.type === 'TSTypeOperator' &&
    unwrapped.operator === 'readonly' &&
    isDefinitelyObjectType(unwrapped.typeAnnotation)
  )
}

function isDefinitelyNarrowerRecordType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type)

  if (unwrapped.type === 'TSTypeLiteral') {
    return unwrapped.members.some((member) => member.type !== 'TSIndexSignature')
  }

  if (unwrapped.type !== 'TSTypeReference') {
    return false
  }

  if (typeReferenceName(unwrapped) === 'Readonly') {
    const inner = unwrapped.typeArguments?.params.at(0)
    return inner !== undefined && isDefinitelyNarrowerRecordType(inner)
  }

  if (typeReferenceName(unwrapped) !== 'Record') {
    return false
  }

  const parameters = unwrapped.typeArguments?.params ?? []
  return parameters.length === 2 && !isUnknownOrAnyType(parameters[1])
}

function functionBoundary(node: ESTree.Node): ESTree.Node | null {
  let current = node.parent

  while (current !== null && current.type !== 'Program') {
    if (functionBoundaryTypes.has(current.type)) {
      return current
    }
    current = current.parent
  }

  return null
}

function stableConstBinding(variable: Variable): DillonAntiSlopTypes.DillonAntiSlopConstBinding | null {
  for (const definition of variable.defs) {
    if (definition.type === 'Variable' && definition.node.type === 'VariableDeclarator') {
      const declarator = definition.node
      const { init } = declarator
      return init !== null &&
        declarator.parent.type === 'VariableDeclaration' &&
        declarator.parent.kind === 'const' &&
        !variable.references.some((reference) => reference.isWrite() && !reference.init)
        ? { declarator, init }
        : null
    }
  }
  return null
}

function knownValueEvidence(
  expression: ESTree.Expression,
  sourceCode: SourceCode,
  boundary: ESTree.Node | null,
  visitedVariables: ReadonlySet<Variable>,
): DillonAntiSlopTypes.DillonAntiSlopKnownValueEvidence | null {
  const unwrapped = expressionsUnwrapParentheses(expression)

  if (expressionsIsAssertion(unwrapped)) {
    return broadTypeKind(unwrapped.typeAnnotation) === null ? { type: unwrapped.typeAnnotation } : null
  }

  if (
    unwrapped.type === 'Literal' ||
    unwrapped.type === 'TemplateLiteral' ||
    unwrapped.type === 'ArrayExpression' ||
    unwrapped.type === 'ArrowFunctionExpression' ||
    unwrapped.type === 'ClassExpression' ||
    unwrapped.type === 'FunctionExpression' ||
    unwrapped.type === 'NewExpression' ||
    unwrapped.type === 'ObjectExpression'
  ) {
    return { type: null }
  }

  if (unwrapped.type !== 'Identifier') {
    return null
  }

  const variable = resolveVariable(sourceCode, unwrapped)

  if (variable === null || visitedVariables.has(variable)) {
    return null
  }

  const annotatedIdentifier = variable.identifiers.find(
    (identifier) => identifier.typeAnnotation !== null && identifier.typeAnnotation !== undefined,
  )

  const annotation = annotatedIdentifier?.typeAnnotation?.typeAnnotation

  if (annotation !== undefined && annotatedIdentifier !== undefined) {
    return functionBoundary(annotatedIdentifier) !== boundary || broadTypeKind(annotation) !== null
      ? null
      : { type: annotation }
  }

  const binding = stableConstBinding(variable)

  if (binding === null || functionBoundary(binding.declarator) !== boundary) {
    return null
  }

  return knownValueEvidence(binding.init, sourceCode, boundary, new Set([...visitedVariables, variable]))
}

export const noWidenThenAssertRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow local const flows that explicitly widen a known value before asserting the widened binding to a narrower type.',
    },
    messages: {
      widenThenAssert: 'Binding "{{name}}" discards type evidence and later recreates it with an assertion. Keep the precise type from initialization through use; parse boundary input once.',
    },
  },
  createOnce(context) {
    const checkAssertion = (node: DillonAntiSlopTypes.DillonAntiSlopTypeAssertion) => {
      const expression = expressionsUnwrapParentheses(node.expression)

      if (expression.type !== 'Identifier') {
        return
      }

      const variable = resolveVariable(context.sourceCode, expression)
      const binding = variable === null ? null : stableConstBinding(variable)

      if (variable === null || binding?.declarator.id.type !== 'Identifier') {
        return
      }

      const { declarator, init } = binding

      const boundary = functionBoundary(declarator)
      const declaredType = declarator.id.typeAnnotation?.typeAnnotation
      const initializer = expressionsUnwrapParentheses(init)
      const initializerAssertion = expressionsIsAssertion(initializer) ? initializer : null

      const initializerBroadKind =
        initializerAssertion === null ? null : broadTypeKind(initializerAssertion.typeAnnotation)

      const broadKind = (declaredType === undefined ? null : broadTypeKind(declaredType)) ?? initializerBroadKind

      if (broadKind === null) {
        return
      }

      const originalExpression =
        initializerAssertion !== null && initializerBroadKind !== null
          ? expressionsUnwrapParentheses(initializerAssertion.expression)
          : init

      const evidence = knownValueEvidence(originalExpression, context.sourceCode, boundary, new Set([variable]))

      if (evidence === null || node.start <= declarator.end || functionBoundary(node) !== boundary) {
        return
      }

      const assertedType = node.typeAnnotation
      const sourceText = context.sourceCode.text

      const narrower =
        broadTypeKind(assertedType) === null &&
        (broadKind === 'top' ||
          (evidence.type !== null &&
            normalizedTypeText(sourceText, evidence.type) === normalizedTypeText(sourceText, assertedType)) ||
          (broadKind === 'object' ? isDefinitelyObjectType(assertedType) : isDefinitelyNarrowerRecordType(assertedType)))

      if (!narrower) {
        return
      }

      context.report({
        node,
        messageId: 'widenThenAssert',
        data: { name: expression.name },
      })
    }

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    }
  },
})
