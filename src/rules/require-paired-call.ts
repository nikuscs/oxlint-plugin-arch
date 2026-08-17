import { defineRule } from '@oxlint/plugins'
import { astCallName, optionsFirst } from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface RequirePairedCallOptions {
  when: string
  require: string
}

/**
 * Requires a second configured call whenever the trigger call appears anywhere in the same file.
 *
 * Example: A file calling `useForm` can require a call to `standardSchemaResolver`.
 */
export const requirePairedCall = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        when: { type: 'string' },
        require: { type: 'string' },
      },
      required: ['when', 'require'],
    }],
    messages: {
      paired: '{{when}} requires a call to {{require}} in the same file.',
    },
  },
  createOnce(context) {
    let firstWhen: ESTree.CallExpression | null = null
    let sawRequired = false

    return {
      before() {
        firstWhen = null
        sawRequired = false
      },
      CallExpression(node) {
        const { when, require } = optionsFirst<RequirePairedCallOptions>(context)
        const name = astCallName(node)

        if (name === when && !firstWhen) {
          firstWhen = node
        }

        if (name === require) {
          sawRequired = true
        }
      },
      after() {
        if (!firstWhen || sawRequired) {
          return
        }

        const { when, require } = optionsFirst<RequirePairedCallOptions>(context)
        context.report({
          node: firstWhen,
          messageId: 'paired',
          data: { when, require },
        })
      },
    }
  },
})
