import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { FilesRestrictedOptions } from '../../types/files.types.ts'

export const filesRestricted = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          message: { type: 'string' },
        },
        required: ['message'],
      },
    ],
    messages: {
      restricted: '{{message}}',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { message } = optionsFirst<FilesRestrictedOptions>(context)

        context.report({
          node: program,
          messageId: 'restricted',
          data: { message },
        })
      },
    }
  },
})
