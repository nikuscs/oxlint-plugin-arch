import { defineRule } from '@oxlint/plugins'
import { dictionaryTypesUnsafeValue, dictionaryTypesWideningTarget } from '../shared/dictionary-types.ts'
import { resolveVariable } from '../shared/resolve-variable.ts'
import { signaturesParameterAnnotation, signaturesParameterName } from '../shared/signatures.ts'
import { typeBindingsWith } from '../shared/type-bindings.ts'
import type { AstFunction } from '../../../types/ast.types.ts'
import type { DillonAntiSlopTypeAssertion, DillonAntiSlopTypeEnvironment, DillonAntiSlopWideningTarget } from '../../../types/dillon-anti-slop.types.ts'
import type * as PluginsTypes from '@oxlint/plugins'

const knownEvidenceTypes = new Set([
  'ObjectExpression',
  'ArrayExpression',
  'ArrowFunctionExpression',
  'ClassExpression',
  'FunctionExpression',
  'NewExpression',
  'Literal',
  'TemplateLiteral',
  'UnaryExpression',
])

function containsUnknown(type: PluginsTypes.ESTree.TSType): boolean {
  if (type.type === 'TSParenthesizedType') {
    return containsUnknown(type.typeAnnotation)
  }

  return type.type === 'TSUnknownKeyword' || (type.type === 'TSUnionType' && type.types.some(containsUnknown))
}

function unwrapExpression(expression: PluginsTypes.ESTree.Expression): PluginsTypes.ESTree.Expression {
  let current = expression

  while (
    current.type === 'ParenthesizedExpression' ||
    current.type === 'TSAsExpression' ||
    current.type === 'TSSatisfiesExpression' ||
    current.type === 'TSTypeAssertion' ||
    current.type === 'TSNonNullExpression'
  ) {
    current = current.expression
  }

  return current
}

function isFunctionLike(node: PluginsTypes.ESTree.Node): node is AstFunction {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'TSDeclareFunction' ||
    node.type === 'TSEmptyBodyFunctionExpression'
  )
}

function stableConstInit(variable: PluginsTypes.Variable): PluginsTypes.ESTree.Expression | null {
  const [definition] = variable.defs

  if (variable.defs.length !== 1 || definition.type !== 'Variable' || definition.node.type !== 'VariableDeclarator') {
    return null
  }

  const declarator = definition.node

  return declarator.parent.type === 'VariableDeclaration' &&
    declarator.parent.kind === 'const' &&
    variable.references.every((reference) => reference.init || !reference.isWrite())
    ? declarator.init
    : null
}

function hasKnownEvidence(
  sourceCode: PluginsTypes.SourceCode,
  expression: PluginsTypes.ESTree.Expression,
  visited = new Set<PluginsTypes.Variable>(),
): boolean {
  if (knownEvidenceTypes.has(unwrapExpression(expression).type)) {
    return true
  }

  const unwrapped = unwrapExpression(expression)
  const variable = unwrapped.type === 'Identifier' ? resolveVariable(sourceCode, unwrapped) : null

  if (variable === null || visited.has(variable)) {
    return false
  }

  const init = stableConstInit(variable)

  if (init === null) {
    return false
  }
  visited.add(variable)

  return hasKnownEvidence(sourceCode, init, visited)
}

function localFunction(sourceCode: PluginsTypes.SourceCode, callee: PluginsTypes.ESTree.Expression): AstFunction | null {
  const unwrapped = unwrapExpression(callee)

  if (isFunctionLike(unwrapped)) {
    return unwrapped
  }

  const variable = unwrapped.type === 'Identifier' ? resolveVariable(sourceCode, unwrapped) : null

  if (variable?.defs.length !== 1) {
    return null
  }

  const [definition] = variable.defs

  if (definition.type === 'FunctionName' && isFunctionLike(definition.node)) {
    return definition.node
  }

  if (definition.type !== 'Variable' || definition.node.type !== 'VariableDeclarator' || definition.node.init === null) {
    return null
  }

  const init = unwrapExpression(definition.node.init)

  return isFunctionLike(init) ? init : null
}

function hasKnownArgumentEvidence(
  sourceCode: PluginsTypes.SourceCode,
  expression: PluginsTypes.ESTree.Expression,
  environment: DillonAntiSlopTypeEnvironment,
  visited = new Set<PluginsTypes.Variable>(),
): boolean {
  if (expression.type === 'ParenthesizedExpression' || expression.type === 'TSNonNullExpression' || expression.type === 'TSSatisfiesExpression') {
    return hasKnownArgumentEvidence(sourceCode, expression.expression, environment, visited)
  }

  if (expression.type === 'TSAsExpression' || expression.type === 'TSTypeAssertion') {
    return dictionaryTypesUnsafeValue(expression.typeAnnotation, environment) === null
  }

  if (expression.type === 'CallExpression') {
    const returnType = localFunction(sourceCode, expression.callee)?.returnType?.typeAnnotation

    return returnType !== undefined && dictionaryTypesUnsafeValue(returnType, environment) === null
  }

  if (expression.type !== 'Identifier') {
    return knownEvidenceTypes.has(unwrapExpression(expression).type)
  }

  const variable = resolveVariable(sourceCode, expression)

  if (variable?.defs.length !== 1 || visited.has(variable)) {
    return false
  }

  const [definition] = variable.defs
  const { node } = definition

  const parameter = definition.type === 'Parameter' && isFunctionLike(node)
    ? node.params.find((candidate) => signaturesParameterName(candidate, sourceCode) === variable.name)
    : undefined

  const annotation = definition.type === 'Variable' && node.type === 'VariableDeclarator' && node.id.type === 'Identifier'
    ? node.id.typeAnnotation
    : parameter && signaturesParameterAnnotation(parameter)

  if (annotation) {
    return dictionaryTypesUnsafeValue(annotation.typeAnnotation, environment) === null
  }

  const init = stableConstInit(variable)

  if (init === null) {
    return false
  }
  visited.add(variable)

  return hasKnownArgumentEvidence(sourceCode, init, environment, visited)
}

function sourceKeyName(sourceCode: PluginsTypes.SourceCode, key: PluginsTypes.ESTree.PropertyKey): string {
  if (key.type === 'Identifier' || key.type === 'PrivateIdentifier') {
    return key.name
  }

  return key.type === 'Literal' ? String(key.value) : sourceCode.getText(key)
}

function functionName(sourceCode: PluginsTypes.SourceCode, owner: AstFunction | null): string {
  if (owner === null) {
    return 'anonymous function'
  }

  if (owner.id !== null) {
    return owner.id.name
  }

  const { parent } = owner

  if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
    return parent.id.name
  }

  return parent.type === 'MethodDefinition' ? sourceKeyName(sourceCode, parent.key) : 'anonymous function'
}

export const noKnownValueWideningRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow syntactically established values from flowing into explicitly broad or anonymous target types that discard useful evidence.',
    },
    messages: {
      widening: 'The explicit {{target}} type on {{subject}} discards known type evidence. Keep inference, validate with `satisfies`, or use a named owner contract.',
    },
  },
  createOnce(context) {
    const annotatedBindings = new Set<string>()
    const predicateNames = new Set<string>()

    const reportFlow = (expression: PluginsTypes.ESTree.Expression, destination: DillonAntiSlopWideningTarget | null, subject: string) => {
      if (destination === null) {
        return
      }

      const unwrapped = unwrapExpression(expression)

      if (
        (destination.kind === 'open dictionary' || destination.kind === 'generic container') &&
        unwrapped.type === 'ObjectExpression' &&
        unwrapped.properties.length === 0
      ) {
        return
      }

      if (hasKnownEvidence(context.sourceCode, expression)) {
        context.report({
          node: expression,
          messageId: 'widening',
          data: { subject, target: destination.kind },
        })
      }
    }

    const annotationTarget = (annotation: PluginsTypes.ESTree.TSTypeAnnotation | null | undefined, environment: DillonAntiSlopTypeEnvironment) =>
      annotation === null || annotation === undefined ? null : dictionaryTypesWideningTarget(annotation.typeAnnotation, environment)

    const checkPredicateCall = (node: PluginsTypes.ESTree.CallExpression, environment: DillonAntiSlopTypeEnvironment) => {
      const owner = localFunction(context.sourceCode, node.callee)
      const predicate = owner?.returnType?.typeAnnotation

      if (owner === null || predicate?.type !== 'TSTypePredicate' || predicate.parameterName.type !== 'Identifier') {
        return
      }

      const subjectName = predicate.parameterName.name
      const index = owner.params.findIndex((parameter) => signaturesParameterName(parameter, context.sourceCode) === subjectName)
      const parameter = owner.params.at(index)
      const argument = node.arguments.at(index)

      if (index === -1 || parameter === undefined || argument === undefined || argument.type === 'SpreadElement') {
        return
      }

      const annotation = signaturesParameterAnnotation(parameter)

      if (
        annotation === null ||
        annotation === undefined ||
        !containsUnknown(annotation.typeAnnotation) ||
        !hasKnownArgumentEvidence(context.sourceCode, argument, environment)
      ) {
        return
      }
      context.report({
        node: argument,
        messageId: 'widening',
        data: {
          subject: `argument for parameter \`${signaturesParameterName(parameter, context.sourceCode)}\` of \`${functionName(context.sourceCode, owner)}\``,
          target: 'unknown',
        },
      })
    }

    const checkReturn = (
      node: PluginsTypes.ESTree.ArrowFunctionExpression | PluginsTypes.ESTree.ReturnStatement,
      environment: DillonAntiSlopTypeEnvironment,
    ) => {
      let owner: PluginsTypes.ESTree.Node = node.type === 'ArrowFunctionExpression' ? node : node.parent

      while (owner.type !== 'Program' && !isFunctionLike(owner)) {
        owner = owner.parent
      }

      if (!isFunctionLike(owner)) {
        return
      }

      const value = node.type === 'ArrowFunctionExpression' ? node.body : node.argument

      if (owner.returnType && value !== null && value.type !== 'BlockStatement') {
        reportFlow(value, annotationTarget(owner.returnType, environment), `return value of \`${functionName(context.sourceCode, owner)}\``)
      }
    }

    return typeBindingsWith(context, (defer) => {
      const assertion = (node: DillonAntiSlopTypeAssertion) => {
        if (node.parent.type !== 'TSAsExpression' && node.parent.type !== 'TSTypeAssertion') {
          defer((environment) => reportFlow(node.expression, dictionaryTypesWideningTarget(node.typeAnnotation, environment), 'assertion'))
        }
      }

      const property = (node: PluginsTypes.ESTree.PropertyDefinition | PluginsTypes.ESTree.AccessorProperty) => {
        const { value, typeAnnotation } = node

        if (typeAnnotation && value) {
          defer((environment) =>
            reportFlow(value, annotationTarget(typeAnnotation, environment), `property \`${sourceKeyName(context.sourceCode, node.key)}\``))
        }
      }

      return {
        Program() {
          predicateNames.clear()
          annotatedBindings.clear()
        },
        AccessorProperty: property,
        PropertyDefinition: property,
        TSAsExpression: assertion,
        TSTypeAssertion: assertion,
        ArrowFunctionExpression(node) {
          if (node.returnType && node.body.type !== 'BlockStatement') {
            defer((environment) => checkReturn(node, environment))
          }
        },
        ReturnStatement(node) {
          if (node.argument) {
            defer((environment) => checkReturn(node, environment))
          }
        },
        AssignmentExpression(node) {
          const { left } = node

          if (node.operator !== '=' || left.type !== 'Identifier') {
            return
          }
          defer((environment) => {
            const variable = annotatedBindings.has(left.name) ? resolveVariable(context.sourceCode, left) : null
            const [definition] = variable?.defs ?? []

            if (variable?.defs.length !== 1 || definition.type !== 'Variable' || definition.node.type !== 'VariableDeclarator') {
              return
            }

            const { id } = definition.node

            if (id.type === 'Identifier') {
              reportFlow(node.right, annotationTarget(id.typeAnnotation, environment), `binding \`${id.name}\``)
            }
          })
        },
        CallExpression(node) {
          const callee = unwrapExpression(node.callee)

          if (callee.type === 'Identifier' || isFunctionLike(callee)) {
            defer((environment) => {
              if (callee.type !== 'Identifier' || predicateNames.has(callee.name)) {
                checkPredicateCall(node, environment)
              }
            })
          }
        },
        TSTypePredicate(node) {
          const owner = node.parent.parent

          if (owner === null || !isFunctionLike(owner) || owner.returnType?.typeAnnotation !== node) {
            return
          }

          if (owner.id) {
            predicateNames.add(owner.id.name)
          }

          let initializer: PluginsTypes.ESTree.Node = owner

          while ('expression' in initializer.parent && initializer.parent.expression === initializer) {
            initializer = initializer.parent
          }

          const declaration = initializer.parent

          if (declaration.type !== 'VariableDeclarator' || declaration.init !== initializer) {
            return
          }

          if (declaration.id.type === 'Identifier') {
            predicateNames.add(declaration.id.name)
            return
          }

          for (const variable of context.sourceCode.getDeclaredVariables(declaration)) {
            predicateNames.add(variable.name)
          }
        },
        VariableDeclarator(node) {
          const { id, init } = node

          if (id.type !== 'Identifier' || !id.typeAnnotation) {
            return
          }
          annotatedBindings.add(id.name)

          const { typeAnnotation } = id

          if (init) {
            defer((environment) => reportFlow(init, annotationTarget(typeAnnotation, environment), `binding \`${id.name}\``))
          }
        },
      }
    })
  },
})
