import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'

export function syntaxRule(selector: string, message: string) {
  return defineRule({
    meta: { type: 'problem', schema: [], messages: { forbidden: message } },
    createOnce(context) {
      return {
        [selector]: (node: ESTree.Node) => context.report({ node, messageId: 'forbidden' }),
      }
    },
  })
}
