import { defineRule } from '@oxlint/plugins'
import { expressionsIsConstAssertion } from '../shared/expressions.ts'
import type { DillonAntiSlopTypeAssertion } from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

const commentOwnerKinds = new Set([
  'ExpressionStatement',
  'PropertyDefinition',
  'ReturnStatement',
  'ThrowStatement',
  'VariableDeclaration',
])

export const requireSafetyCommentForTypeAssertionRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require a nearby SAFETY comment for every TypeScript type assertion except const assertions.',
    },
    messages: {
      missingSafetyComment: 'This type assertion has no `SAFETY:` justification. State the checked invariant immediately before the assertion or its containing statement.',
    },
  },
  createOnce(context) {
    const checkAssertion = (node: DillonAntiSlopTypeAssertion) => {
      if (expressionsIsConstAssertion(node)) {
        return
      }

      let current: ESTree.Node = node

      for (;;) {
        if (
          context.sourceCode
            .getCommentsBefore(current)
            .some((comment) => comment.end <= node.start && /\bSAFETY\s*:/u.test(comment.value))
        ) {
          return
        }

        const parent: ESTree.Node = current.parent

        if (
          (commentOwnerKinds.has(current.type) &&
            parent.type !== 'ExportNamedDeclaration' &&
            parent.type !== 'ExportDefaultDeclaration') ||
          parent.type === 'Program'
        ) {
          break
        }
        current = parent
      }
      context.report({ node, messageId: 'missingSafetyComment' })
    }

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    }
  },
})
