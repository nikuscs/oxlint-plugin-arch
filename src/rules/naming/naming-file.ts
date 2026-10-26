import { defineRule } from '@oxlint/plugins'
import { readdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { namingBasename } from '../../utils/naming.utils.ts'
import { optionsAll, optionsPatternSchema, optionsPatternsTest, optionsPatternsWithEmpty } from '../../utils/options.utils.ts'
import type { NamingFileOptions } from '../../types/naming.types.ts'

export const namingFile = defineRule({
  meta: {
    type: 'problem',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          pattern: optionsPatternSchema,
          message: { type: 'string' },
          flags: { type: 'string' },
          unique: { type: 'string', minLength: 1 },
        },
        required: ['pattern', 'message'],
      },
    },
    messages: {
      mismatch: '{{message}}',
      duplicate: "'{{key}}' is also used by {{others}}; this part of the file name must be unique in its folder.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const basename = namingBasename(context.filename)
        let siblings: string[] | undefined

        for (const { pattern, message, flags, unique } of optionsAll<NamingFileOptions>(context)) {
          const patterns = optionsPatternsWithEmpty(pattern, flags)

          if (!optionsPatternsTest(patterns, basename)) {
            context.report({
              node: program,
              messageId: 'mismatch',
              data: { message },
            })
          }

          if (unique === undefined) {
            continue
          }

          const matcher = new RegExp(unique)

          const keyOf = (name: string) => {
            const match = matcher.exec(name)
            return match ? (match.at(1) ?? match[0]) : undefined
          }

          const key = keyOf(basename)

          if (key === undefined) {
            continue
          }

          if (!siblings) {
            try {
              siblings = readdirSync(dirname(context.filename), { withFileTypes: true }).flatMap((entry) => (entry.isFile() ? [entry.name] : []))
            } catch {
              siblings = []
            }
          }

          const others = siblings.filter((name) => name !== basename && optionsPatternsTest(patterns, name) && keyOf(name) === key)

          if (others.length > 0) {
            context.report({
              node: program,
              messageId: 'duplicate',
              data: { key, others: others.join(', ') },
            })
          }
        }
      },
    }
  },
})
