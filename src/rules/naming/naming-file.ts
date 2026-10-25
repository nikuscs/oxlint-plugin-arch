import { defineRule } from '@oxlint/plugins'
import { namingBasename } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsPatternSchema, optionsPatternsTest, optionsPatternsWithEmpty } from '../../utils/options.utils.ts'
import type { NamingFileOptions } from '../../types/naming.types.ts'

export const namingFile = defineRule({
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
        const { pattern, message, flags } = optionsFirst<NamingFileOptions>(context)

        if (optionsPatternsTest(optionsPatternsWithEmpty(pattern, flags), namingBasename(context.filename))) {
          return
        }
        context.report({
          node: program,
          messageId: 'mismatch',
          data: { message },
        })
      },
    }
  },
})
