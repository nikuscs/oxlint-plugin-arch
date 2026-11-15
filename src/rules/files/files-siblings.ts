import { defineRule } from '@oxlint/plugins'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { namingCaptures, namingCaptureSchemaProperties, namingExpand, namingSiblings } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsMessage, optionsPatternSchema } from '../../utils/options.utils.ts'
import type { FilesSiblingsOptions } from '../../types/files.types.ts'

const filesSiblingsList = {
  anyOf: [{ type: 'string' }, { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' }, minItems: 1 }] }, minItems: 1 }],
}

export const filesSiblings = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          require: filesSiblingsList,
          forbid: optionsPatternSchema,
          when: optionsPatternSchema,
          message: { type: 'string' },
          ...namingCaptureSchemaProperties,
        },
        anyOf: [{ required: ['require'] }, { required: ['forbid'] }],
      },
    ],
    messages: {
      missing: "This file needs '{{file}}' beside it.{{message}}",
      forbidden: "This file may not sit beside '{{file}}'.{{message}}",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const options = optionsFirst<FilesSiblingsOptions>(context, {})
        const captures = namingCaptures(context.filename, options)

        if (!captures || !namingSiblings(context.filename, options.when, captures)) {
          return
        }

        const message = optionsMessage(options.message)
        const exists = (template: string) => existsSync(join(dirname(context.filename), namingExpand(template, captures, false)))

        for (const entry of options.require === undefined ? [] : [options.require].flat()) {
          const anyOf = [entry].flat()

          if (!anyOf.some(exists)) {
            context.report({
              node: program,
              messageId: 'missing',
              data: { file: anyOf.map((template) => namingExpand(template, captures, false)).join("' or '"), message },
            })
          }
        }

        for (const template of options.forbid === undefined ? [] : [options.forbid].flat()) {
          if (exists(template)) {
            context.report({
              node: program,
              messageId: 'forbidden',
              data: { file: namingExpand(template, captures, false), message },
            })
          }
        }
      },
    }
  },
})
