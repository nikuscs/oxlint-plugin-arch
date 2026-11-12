import { defineRule } from '@oxlint/plugins'
import { optionsEscape, optionsFirst } from '../../../utils/options.utils.ts'
import { expressionsIsConstAssertion } from '../shared/expressions.ts'
import type { DillonAntiSlopSafetyCommentOptions, DillonAntiSlopTypeAssertion } from '../../../types/dillon-anti-slop.types.ts'
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
    schema: [{ type: 'object', additionalProperties: false, properties: { comment: { type: 'string', minLength: 1 } } }],
    messages: {
      missingSafetyComment: 'This type assertion has no `{{comment}}` justification. State the checked invariant immediately before the assertion or its containing statement.',
    },
  },
  createOnce(context) {
    let comment = 'SAFETY:'
    let marker = /(?<![\p{L}\p{N}_])SAFETY\s*:/u

    const checkAssertion = (node: DillonAntiSlopTypeAssertion) => {
      if (expressionsIsConstAssertion(node)) {
        return
      }

      let current: ESTree.Node = node
      const justified = (candidate: ESTree.Comment) => candidate.end <= node.start && marker.test(candidate.value)

      for (;;) {
        if (
          context.sourceCode
            .getCommentsBefore(current)
            .some(justified)
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
      context.report({
        node,
        messageId: 'missingSafetyComment',
        data: { comment },
      })
    }

    return {
      before() {
        comment = optionsFirst<DillonAntiSlopSafetyCommentOptions>(context, {}).comment ?? 'SAFETY:'
        const word = optionsEscape(comment.replace(/:\s*$/, ''))
        marker = new RegExp(`(?<![\\p{L}\\p{N}_])${word}\\s*:`, 'u')
      },
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    }
  },
})
