import { defineRule } from '@oxlint/plugins'
import { astMemberName, astStaticString, astUnwrap } from '../../utils/ast.utils.ts'
import { boundariesDeclaredVariable } from '../../utils/boundaries.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { BackendSqlLikeOptions } from '../../types/backend.types.ts'
import type { ESTree, Variable } from '@oxlint/plugins'

export const backendSqlLike = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          methods: { type: 'array', items: { type: 'string' } },
          sanitizers: { type: 'array', items: { type: 'string' } },
          bindings: { type: 'boolean' },
          operators: { type: 'array', items: { type: 'string' } },
        },
        required: ['methods', 'sanitizers'],
      },
    ],
    messages: { unescaped: '.{{method}}() values must use a configured sanitizer.' },
  },
  createOnce(context) {
    let options: BackendSqlLikeOptions = { methods: [], sanitizers: [] }
    const seen = new Set<Variable>()

    function sanitizedBinding(identifier: ESTree.Node, name: string): boolean {
      const variable = options.bindings === false ? null : boundariesDeclaredVariable(context.sourceCode.getScope(identifier), name)
      const declarator = variable?.defs.length === 1 && variable.defs[0].type === 'Variable' ? variable.defs[0].node : undefined
      const statement = declarator?.parent?.parent

      if (
        !variable ||
        declarator?.type !== 'VariableDeclarator' ||
        seen.has(variable) ||
        !(statement?.type === 'Program' || (statement?.type === 'ExportNamedDeclaration' && statement.parent.type === 'Program')) ||
        variable.references.some((reference) => reference.isWrite() && !reference.init)
      ) {
        return false
      }

      seen.add(variable)
      const result = sanitized(declarator.init)
      seen.delete(variable)

      return result
    }

    function sanitized(node: ESTree.Node | null | undefined): boolean {
      if (!node || node.type === 'SpreadElement') {
        return false
      }

      const value = node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression' || node.type === 'TSNonNullExpression' ? astUnwrap(node) : node

      if (value.type === 'Identifier') {
        return sanitizedBinding(value, value.name)
      }

      if (value.type === 'CallExpression') {
        const { callee } = value

        return callee.type === 'Identifier'
          ? options.sanitizers.includes(callee.name)
          : callee.type === 'MemberExpression' && value.arguments.length === 0 && sanitized(callee.object)
      }

      const parts: ESTree.Expression[] = []

      if (value.type === 'TemplateLiteral') {
        parts.push(...value.expressions)
      }

      if (value.type === 'ConditionalExpression') {
        parts.push(value.consequent, value.alternate)
      }

      if ((value.type === 'BinaryExpression' && value.operator === '+') || value.type === 'LogicalExpression') {
        parts.push(value.left, value.right)
      }

      const results = parts.map((part) => (astStaticString(part) === undefined ? sanitized(part) : undefined))

      return results.includes(true) && !results.includes(false)
    }

    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return
        }

        options = optionsFirst<BackendSqlLikeOptions>(context)
        const { methods, operators: operatorMethods = [] } = options
        const method = astMemberName(node.callee)

        if (!method) {
          return
        }

        const operator = node.arguments.at(1)

        const operatorCall =
          operatorMethods.includes(method) &&
          operator?.type === 'Literal' &&
          typeof operator.value === 'string' &&
          methods.includes(operator.value)

        if (!methods.includes(method) && !operatorCall) {
          return
        }

        const value = node.arguments.at(-1)

        if (!sanitized(value)) {
          context.report({
            node: value ?? node,
            messageId: 'unescaped',
            data: { method },
          })
        }
      },
    }
  },
})
