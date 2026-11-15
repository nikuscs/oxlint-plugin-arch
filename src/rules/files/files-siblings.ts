import { defineRule } from '@oxlint/plugins'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { namingCaptures, namingExpand } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsPatternSchema } from '../../utils/options.utils.ts'
import type { FilesSiblingsOptions } from '../../types/files.types.ts'

export const filesSiblings = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          require: optionsPatternSchema,
          message: { type: 'string' },
        },
        required: ['require'],
      },
    ],
    messages: {
      missing: "This file needs '{{file}}' beside it.{{message}}",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const options = optionsFirst<FilesSiblingsOptions>(context, { require: [] })
        const captures = namingCaptures(context.filename) ?? {}

        for (const template of [options.require].flat()) {
          const file = namingExpand(template, captures, false)

          if (!existsSync(join(dirname(context.filename), file))) {
            context.report({
              node: program,
              messageId: 'missing',
              data: { file, message: options.message ? ` ${options.message}` : '' },
            })
          }
        }
      },
    }
  },
})
