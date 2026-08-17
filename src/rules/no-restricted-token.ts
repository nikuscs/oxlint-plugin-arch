import { defineRule } from '@oxlint/plugins'
import { namingPosixPath, optionsFirst } from '../utils/index.ts'

interface NoRestrictedTokenOptions {
  token: string
  allowIn: string[]
  allowPathPatterns?: string[]
}

/**
 * Restricts one identifier to configured owner paths while leaving path selection to the consumer.
 *
 * Example: `RouterClient` can be allowed in `rpc.client.ts` and rejected everywhere else.
 */
export const noRestrictedToken = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        token: { type: 'string' },
        allowIn: { type: 'array', items: { type: 'string' } },
        allowPathPatterns: { type: 'array', items: { type: 'string' } },
      },
      required: ['token', 'allowIn'],
    }],
    messages: {
      restricted: "'{{token}}' may only appear in configured owner paths.",
    },
  },
  createOnce(context) {
    return {
      before() {
        const options = optionsFirst<NoRestrictedTokenOptions>(context)
        const filename = namingPosixPath(context.filename)
        const allowed = options.allowIn.some((suffix) => filename.endsWith(suffix))
          || (options.allowPathPatterns ?? []).some((pattern) => new RegExp(pattern).test(filename))

        if (allowed) {
          return false
        }
      },
      Identifier(node) {
        const { token } = optionsFirst<NoRestrictedTokenOptions>(context)

        if (node.name === token) {
          context.report({
            node,
            messageId: 'restricted',
            data: { token },
          })
        }
      },
    }
  },
})
