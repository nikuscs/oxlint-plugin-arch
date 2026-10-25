import { defineRule } from '@oxlint/plugins'
import { declarationsFunctions } from '../../utils/declarations.utils.ts'
import { exportsFunctions } from '../../utils/exports.utils.ts'
import { namingBasename, namingPascalCase } from '../../utils/naming.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { FilesFactoryOptions } from '../../types/files.types.ts'

export const filesFactory = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          factory: { type: 'string' },
          allDeclarations: { type: 'boolean' },
        },
        required: ['factory'],
      },
    ],
    messages: {
      factory: "Function '{{actual}}' must be named '{{expected}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { factory, allDeclarations = false } = optionsFirst<FilesFactoryOptions>(context)
        const stem = namingBasename(context.filename).replace(/\.(tsx?|jsx?)$/, '')
        const expected = factory.replaceAll('{Stem}', namingPascalCase(stem)).replaceAll('{stem}', stem)
        const functions = allDeclarations ? declarationsFunctions(program) : exportsFunctions(program)

        if (functions.length === 0) {
          context.report({
            node: program,
            messageId: 'factory',
            data: { actual: '<none>', expected },
          })

          return
        }

        for (const item of functions) {
          if (item.name !== expected) {
            context.report({
              node: item.node,
              messageId: 'factory',
              data: { actual: item.name, expected },
            })
          }
        }
      },
    }
  },
})
