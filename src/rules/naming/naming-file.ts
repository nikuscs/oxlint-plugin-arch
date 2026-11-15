import { defineRule } from '@oxlint/plugins'
import { readdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { namingBasename, namingCaptures, namingSiblings, namingTemplatePattern } from '../../utils/naming.utils.ts'
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
          template: optionsPatternSchema,
          placeholder: { type: 'string' },
          when: optionsPatternSchema,
        },
        required: ['message'],
        anyOf: [{ required: ['pattern'] }, { required: ['template'] }],
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

        for (const { pattern, message, flags, unique, template, placeholder, when } of optionsAll<NamingFileOptions>(context)) {
          if (when !== undefined && !namingSiblings(context.filename, when, namingCaptures(context.filename) ?? {})) {
            continue
          }

          const patterns = optionsPatternsWithEmpty(pattern, flags)
          const path = context.filename.replaceAll('\\', '/').split('/')
          const templates = [template ?? []].flat()
          const fits = templates.some((item) => namingTemplatePattern(item, placeholder)?.test(path.slice(-item.split('/').length).join('/')))

          if ((pattern !== undefined && !optionsPatternsTest(patterns, basename)) || (templates.length > 0 && !fits)) {
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
