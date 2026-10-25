import { defineRule } from '@oxlint/plugins'
import { declarationsFunctions } from '../../utils/declarations.utils.ts'
import { exportsFunctions } from '../../utils/exports.utils.ts'
import { namingBasename, namingExpandTemplate, namingMatchTemplate } from '../../utils/naming.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { NamingExportTemplateOptions } from '../../types/naming.types.ts'

export const namingExportTemplate = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          file: { type: 'string' },
          export: { type: 'string' },
          mode: { type: 'string', enum: ['all', 'some'] },
          placeholderPattern: { type: 'string' },
          camelCase: { type: 'boolean' },
          allDeclarations: { type: 'boolean' },
        },
        required: ['file', 'export'],
      },
    ],
    messages: {
      mismatch: "Function '{{actual}}' must be named '{{expected}}' for file '{{file}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { file: template, export: exportTemplate, mode = 'all', placeholderPattern, allDeclarations = false, camelCase = false } =
          optionsFirst<NamingExportTemplateOptions>(context)

        const file = namingBasename(context.filename)
        const groups = namingMatchTemplate(file, template, placeholderPattern)

        if (!groups) {
          return
        }

        const expected = namingExpandTemplate(exportTemplate, groups, camelCase)
        const functions = allDeclarations ? declarationsFunctions(program) : exportsFunctions(program)

        if (mode === 'some') {
          if (functions.some((item) => item.name === expected)) {
            return
          }

          const first = functions.at(0)
          context.report({
            node: first?.node ?? program,
            messageId: 'mismatch',
            data: { actual: first?.name ?? '<none>', expected, file },
          })

          return
        }

        for (const item of functions) {
          if (item.name !== expected) {
            context.report({
              node: item.node,
              messageId: 'mismatch',
              data: { actual: item.name, expected, file },
            })
          }
        }
      },
    }
  },
})
