import { defineRule } from '@oxlint/plugins'
import { declarationsIsObjectParam } from '../../utils/declarations.utils.ts'
import { exportsCheckedFunctions } from '../../utils/exports.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema } from '../../utils/options.utils.ts'
import type { CodeObjectParamsOptions } from '../../types/code.types.ts'

export const codeObjectParams = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          maxParams: { type: 'integer', minimum: 1 },
          serviceMethods: { type: 'boolean' },
          allDeclarations: { type: 'boolean' },
          allowPattern: optionsPatternSchema,
        },
      },
    ],
    messages: {
      objectParams: '{{label}} {{name}} must accept at most {{maxParams}} object parameter{{s}}.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          maxParams = 1,
          allDeclarations = false,
          serviceMethods = false,
          allowPattern,
        } = optionsFirst<CodeObjectParamsOptions>(context, {})

        for (const { name, node } of exportsCheckedFunctions(program, allDeclarations, serviceMethods, optionsPatterns(allowPattern))) {
          if (node.params.length <= maxParams && node.params.every(declarationsIsObjectParam)) {
            continue
          }
          context.report({
            node,
            messageId: 'objectParams',
            data: {
              label: allDeclarations ? 'Function' : 'Exported function',
              name,
              maxParams: maxParams === 1 ? 'one' : String(maxParams),
              s: maxParams === 1 ? '' : 's',
            },
          })
        }
      },
    }
  },
})
