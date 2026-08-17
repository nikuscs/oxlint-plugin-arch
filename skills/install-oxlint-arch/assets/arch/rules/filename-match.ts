import { defineRule } from '@oxlint/plugins'
import { namingFileBasename, optionsFirst } from '../utils/index.ts'

interface FilenameMatchOptions {
  pattern: string
  message: string
  flags?: string
}

/**
 * Checks the current filename against a configurable regular expression and reports the configured message.
 *
 * Example: A pattern ending in `.spec.ts` accepts `login.spec.ts` and rejects `login.test.ts`.
 */
export const filenameMatch = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        pattern: { type: 'string' },
        message: { type: 'string' },
        flags: { type: 'string' },
      },
      required: ['pattern', 'message'],
    }],
    messages: {
      mismatch: '{{message}}',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { pattern, message, flags } = optionsFirst<FilenameMatchOptions>(context)

        if (!new RegExp(pattern, flags).test(namingFileBasename(context.filename))) {
          context.report({
            node: program,
            messageId: 'mismatch',
            data: { message },
          })
        }
      },
    }
  },
})
