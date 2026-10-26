import { defineRule } from '@oxlint/plugins'
import { resolveVariable } from '../shared/resolve-variable.ts'
import { typeEnvironmentCreate } from '../shared/type-environment.ts'
import { wideningTargetsClassify } from '../shared/widening-targets.ts'
import type { AstFunction } from '../../../types/ast.types.ts'
import type * as DillonAntiSlopTypes from '../../../types/dillon-anti-slop.types.ts'
import type * as PluginsTypes from '@oxlint/plugins'

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

function variableDeclarator(variable: PluginsTypes.Variable): PluginsTypes.ESTree.VariableDeclarator | null {
  if (variable.defs.length !== 1) {
    return null
  }

  const [definition] = variable.defs
  return definition.type === 'Variable' && definition.node.type === 'VariableDeclarator' ? definition.node : null
}

function hasKnownEvidence(
  sourceCode: PluginsTypes.SourceCode,
  expression: PluginsTypes.ESTree.Expression,
  visitedVariables = new Set<PluginsTypes.Variable>(),
): boolean {
  const unwrapped = unwrapExpression(expression)

  if (
    unwrapped.type === 'ObjectExpression' ||
    unwrapped.type === 'ArrayExpression' ||
    unwrapped.type === 'ArrowFunctionExpression' ||
    unwrapped.type === 'ClassExpression' ||
    unwrapped.type === 'FunctionExpression' ||
    unwrapped.type === 'NewExpression' ||
    unwrapped.type === 'Literal' ||
    unwrapped.type === 'TemplateLiteral' ||
    unwrapped.type === 'UnaryExpression'
  ) {
    return true
  }

  if (unwrapped.type !== 'Identifier') {
    return false
  }

  const variable = resolveVariable(sourceCode, unwrapped)

  if (variable === null || visitedVariables.has(variable)) {
    return false
  }

  const declarator = variableDeclarator(variable)

  if (declarator === null) {
    return false
  }

  if (
    declarator.init === null ||
    declarator.parent.type !== 'VariableDeclaration' ||
    declarator.parent.kind !== 'const' ||
    !variable.references.every((reference) => reference.init || !reference.isWrite())
  ) {
    return false
  }
  visitedVariables.add(variable)

  return hasKnownEvidence(sourceCode, declarator.init, visitedVariables)
}

function sourceKeyName(sourceCode: PluginsTypes.SourceCode, key: PluginsTypes.ESTree.PropertyKey): string {
  if (key.type === 'Identifier' || key.type === 'PrivateIdentifier') {
    return key.name
  }

  if (key.type === 'Literal') {
    return String(key.value)
  }

  return sourceCode.getText(key)
}

function functionName(sourceCode: PluginsTypes.SourceCode, owner: AstFunction | null): string {
  if (owner === null) {
    return 'anonymous function'
  }

  if (owner.id !== null) {
    return owner.id.name
  }

  const parent = owner.parent

  if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
    return parent.id.name
  }

  if (parent.type === 'MethodDefinition') {
    return sourceKeyName(sourceCode, parent.key)
  }

  return 'anonymous function'
}

function hasParentAssertion(node: PluginsTypes.ESTree.Node): boolean {
  return node.parent?.type === 'TSAsExpression' || node.parent?.type === 'TSTypeAssertion'
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
    let environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment | null = null

    const reportFlow = (
      expression: PluginsTypes.ESTree.Expression,
      destination: DillonAntiSlopTypes.DillonAntiSlopWideningTarget | null,
      subject: string,
    ) => {
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

      if (!hasKnownEvidence(context.sourceCode, expression)) {
        return
      }
      context.report({
        node: expression,
        messageId: 'widening',
        data: { subject, target: destination.kind },
      })
    }

    const targetFromAnnotation = (annotation: PluginsTypes.ESTree.TSTypeAnnotation | null | undefined) =>
      environment === null || annotation === null || annotation === undefined
        ? null
        : wideningTargetsClassify(annotation.typeAnnotation, environment)

    return {
      Program(node) {
        environment = typeEnvironmentCreate(node)
      },
      VariableDeclarator(node) {
        if (node.init === null || node.id.type !== 'Identifier') {
          return
        }
        reportFlow(node.init, targetFromAnnotation(node.id.typeAnnotation), `binding \`${node.id.name}\``)
      },
      PropertyDefinition(node) {
        if (node.value === null) {
          return
        }
        reportFlow(
          node.value,
          targetFromAnnotation(node.typeAnnotation),
          `property \`${sourceKeyName(context.sourceCode, node.key)}\``,
        )
      },
      AccessorProperty(node) {
        if (node.value === null) {
          return
        }
        reportFlow(
          node.value,
          targetFromAnnotation(node.typeAnnotation),
          `property \`${sourceKeyName(context.sourceCode, node.key)}\``,
        )
      },
      AssignmentExpression(node) {
        if (node.operator !== '=' || node.left.type !== 'Identifier') {
          return
        }

        const variable = resolveVariable(context.sourceCode, node.left)
        const declarator = variable === null ? null : variableDeclarator(variable)

        if (declarator?.id.type !== 'Identifier') {
          return
        }
        reportFlow(node.right, targetFromAnnotation(declarator.id.typeAnnotation), `binding \`${declarator.id.name}\``)
      },
      ReturnStatement(node) {
        if (node.argument === null) {
          return
        }

        let owner: AstFunction | null = null
        let current: PluginsTypes.ESTree.Node = node.parent

        while (owner === null && current.type !== 'Program') {
          if (
            current.type === 'ArrowFunctionExpression' ||
            current.type === 'FunctionDeclaration' ||
            current.type === 'FunctionExpression'
          ) {
            owner = current
          }
          current = current.parent
        }
        reportFlow(
          node.argument,
          targetFromAnnotation(owner?.returnType),
          `return value of \`${functionName(context.sourceCode, owner)}\``,
        )
      },
      ArrowFunctionExpression(node) {
        if (node.body.type === 'BlockStatement') {
          return
        }
        reportFlow(
          node.body,
          targetFromAnnotation(node.returnType),
          `return value of \`${functionName(context.sourceCode, node)}\``,
        )
      },
      TSAsExpression(node) {
        if (environment === null || hasParentAssertion(node)) {
          return
        }
        reportFlow(node.expression, wideningTargetsClassify(node.typeAnnotation, environment), 'assertion')
      },
      TSTypeAssertion(node) {
        if (environment === null || hasParentAssertion(node)) {
          return
        }
        reportFlow(node.expression, wideningTargetsClassify(node.typeAnnotation, environment), 'assertion')
      },
    }
  },
})
