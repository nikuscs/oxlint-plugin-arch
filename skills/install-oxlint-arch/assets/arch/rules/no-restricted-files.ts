import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../utils/index.ts'

interface NoRestrictedFilesOptions {
  message: string
}

/**
 * Reports every file matched by the consumer glob, making forbidden file locations or extensions lintable.
 *
 * Example: Enable it for hook TSX files to require hooks to use `.ts` files.
 */
export const noRestrictedFiles = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        message: { type: 'string' },
      },
      required: ['message'],
    }],
    messages: {
      restricted: '{{message}}',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { message } = optionsFirst<NoRestrictedFilesOptions>(context)
        context.report({
          node: program,
          messageId: 'restricted',
          data: { message },
        })
      },
    }
  },
})
