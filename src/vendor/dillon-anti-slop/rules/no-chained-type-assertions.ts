import { defineRule } from '@oxlint/plugins'
import { expressionsIsAssertion, expressionsIsConstAssertion, expressionsUnwrapParentheses } from '../shared/expressions.ts'
import type { DillonAntiSlopTypeAssertion } from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const noChainedTypeAssertionsRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow chained TypeScript as and angle-bracket assertions, including parenthesized chains.',
    },
    messages: {
      chained: 'This assertion chain discards type evidence. Keep the original precise type, or parse untrusted input at its boundary before narrowing it.',
    },
  },
  createOnce(context) {
    const checkTypeAssertion = (node: DillonAntiSlopTypeAssertion) => {
      let outer: ESTree.Expression = node
      let parent = node.parent

      while (parent.type === 'ParenthesizedExpression' && parent.expression === outer) {
        outer = parent
        parent = parent.parent
      }

      if (expressionsIsAssertion(parent) && parent.expression === outer) {
        return
      }

      let assertionCount = 0
      let hasNonConstAssertion = false
      let current: ESTree.Expression = node

      while (expressionsIsAssertion(current)) {
        assertionCount += 1
        hasNonConstAssertion ||= !expressionsIsConstAssertion(current)
        current = expressionsUnwrapParentheses(current.expression)
      }

      if (assertionCount > 1 && hasNonConstAssertion) {
        context.report({ node, messageId: 'chained' })
      }
    }

    return {
      TSAsExpression: checkTypeAssertion,
      TSTypeAssertion: checkTypeAssertion,
    }
  },
})
