import { defineRule } from '@oxlint/plugins'
import { resolveVariable } from './resolve-variable.ts'

export function reflectMethodRule(methodName: string, messageId: string, description: string, message: string) {
  return defineRule({
    meta: {
      type: 'problem',
      docs: { description },
      messages: { [messageId]: message },
    },
    createOnce(context) {
      return {
        CallExpression(node) {
          const { callee } = node

          if (
            callee.type === 'Super' ||
            callee.type === 'V8IntrinsicExpression' ||
            !('property' in callee) ||
            !('object' in callee) ||
            !('computed' in callee)
          ) {
            return
          }

          const { object, property } = callee

          if (object.type !== 'Identifier' || object.name !== 'Reflect') {
            return
          }

          if (!context.sourceCode.isGlobalReference(object)) {
            const variable = resolveVariable(context.sourceCode, object)

            if (variable !== null && variable.defs.length > 0) {
              return
            }
          }

          if (
            callee.computed
              ? property.type === 'Literal' && property.value === methodName
              : property.type === 'Identifier' && property.name === methodName
          ) {
            context.report({ node, messageId })
          }
        },
      }
    },
  })
}
