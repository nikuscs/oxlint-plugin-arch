import { defineRule } from '@oxlint/plugins'
import {
  namingFileBasename,
  optionsFirst,
  optionsPatterns,
  optionsPatternSchema,
  optionsPatternsTest,
} from '../utils/index.ts'
import type { OptionsPattern } from '../utils/index.ts'

interface FilenameMatchOptions {
  pattern: OptionsPattern
  message: string
  flags?: string
}

/**
 * Checks the current filename against one or more regular expressions (any may match) and reports the configured message.
 *
 * Example: A pattern ending in `.spec.ts` accepts `login.spec.ts` and rejects `login.test.ts`.
 */
export const filenameMatch = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          pattern: optionsPatternSchema,
          message: { type: 'string' },
          flags: { type: 'string' },
        },
        required: ['pattern', 'message'],
      },
    ],
    messages: {
      mismatch: '{{message}}',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { pattern, message, flags } = optionsFirst<FilenameMatchOptions>(context)

        const patterns = optionsPatterns(pattern, flags)
        if (!optionsPatternsTest(patterns, namingFileBasename(context.filename))) {
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
