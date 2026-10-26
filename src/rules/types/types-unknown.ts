import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'

function isCatchName(node: ESTree.Node): boolean {
  const key = 'key' in node && !('computed' in node && node.computed) ? node.key : undefined
  return key?.type === 'Identifier' && key.name === 'catch'
}

export const typesUnknown = defineRule({
  meta: { type: 'problem', schema: [], messages: { forbidden: 'Use an owned domain type rather than unknown.' } },
  createOnce(context) {
    return {
      TSUnknownKeyword(node) {
        const annotation = node.parent
        const parameter = annotation.type === 'TSTypeAnnotation' ? annotation.parent : undefined
        const owner = parameter?.type === 'Identifier' ? parameter.parent : undefined

        if (!owner || !('params' in owner) || !owner.params.some((entry: ESTree.Node) => entry === parameter)) {
          context.report({ node, messageId: 'forbidden' })
          return
        }

        const predicate = 'returnType' in owner ? owner.returnType?.typeAnnotation : undefined
        const holder = owner.parent

        const allowed =
          predicate?.type === 'TSTypePredicate' && predicate.parameterName.type === 'Identifier'
            ? parameter?.type === 'Identifier' && predicate.parameterName.name === parameter.name
            : owner.params[0] === parameter &&
              (isCatchName(owner) ||
                isCatchName(holder) ||
                (holder.type === 'TSTypeAnnotation' && isCatchName(holder.parent)) ||
                (holder.type === 'CallExpression' &&
                  holder.arguments.some((entry) => entry === owner) &&
                  holder.callee.type === 'MemberExpression' &&
                  !holder.callee.computed &&
                  holder.callee.property.type === 'Identifier' &&
                  holder.callee.property.name === 'catch'))

        if (!allowed) {
          context.report({ node, messageId: 'forbidden' })
        }
      },
    }
  },
})
