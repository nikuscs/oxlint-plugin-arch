import { defineRule } from '@oxlint/plugins'
import { astIsCall } from '../../utils/ast.utils.ts'

export const codeYieldArgument = defineRule({
  meta: {
    type: 'suggestion',
    messages: {
      named: 'Yield into a named const first, then pass the name.',
    },
  },
  createOnce(context) {
    return {
      YieldExpression(node) {
        const parent = node.parent
        const argument = astIsCall(parent) && parent.arguments.some((item) => item === node)
        const receiver = parent.type === 'MemberExpression' && parent.object === node

        if (node.delegate && (argument || receiver)) {
          context.report({ node, messageId: 'named' })
        }
      },
    }
  },
})
