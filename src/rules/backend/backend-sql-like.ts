import { defineRule } from '@oxlint/plugins'
import { astMemberName, astVisit } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { BackendSqlLikeOptions } from '../../types/backend.types.ts'

function backendCallsSanitizer(node: unknown, sanitizers: string[]): boolean {
  let found = false
  astVisit(node, [], (candidate) => {
    if (candidate.type === 'CallExpression' && candidate.callee.type === 'Identifier' && sanitizers.includes(candidate.callee.name)) {
      found = true
    }
  })

  return found
}

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
          allowSanitizedBindings: { type: 'boolean' },
          operatorMethods: { type: 'array', items: { type: 'string' } },
        },
        required: ['methods', 'sanitizers'],
      },
    ],
    messages: { unescaped: '.{{method}}() values must use a configured sanitizer.' },
  },
  createOnce(context) {
    let sanitized = new Set<string>()
    return {
      Program(program) {
        const { sanitizers, allowSanitizedBindings = true } = optionsFirst<BackendSqlLikeOptions>(context)
        sanitized = new Set()

        for (const statement of allowSanitizedBindings ? program.body : []) {
          const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement

          if (declaration?.type !== 'VariableDeclaration') {
            continue
          }

          for (const item of declaration.declarations) {
            if (item.id.type === 'Identifier' && backendCallsSanitizer(item.init, sanitizers)) {
              sanitized.add(item.id.name)
            }
          }
        }
      },
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return
        }

        const { methods, sanitizers, operatorMethods = [] } = optionsFirst<BackendSqlLikeOptions>(context)
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

        if (value?.type === 'Identifier' && sanitized.has(value.name)) {
          return
        }

        if (!backendCallsSanitizer(value, sanitizers)) {
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
