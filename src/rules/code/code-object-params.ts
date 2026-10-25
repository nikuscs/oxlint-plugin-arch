import { defineRule } from '@oxlint/plugins'
import { exportsCheckedFunctions } from '../../utils/exports.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema } from '../../utils/options.utils.ts'
import type { CodeObjectParamsOptions } from '../../types/code.types.ts'
import type { ESTree } from '@oxlint/plugins'

function isObjectParam(node: ESTree.ParamPattern): boolean {
  if (node.type === 'ObjectPattern') {
    return true
  }

  if (node.type === 'TSParameterProperty') {
    return isObjectParam(node.parameter)
  }

  if (node.type === 'AssignmentPattern') {
    return isObjectParam(node.left)
  }

  const annotation = node.typeAnnotation?.typeAnnotation
  return (
    !annotation ||
    annotation.type === 'TSTypeReference' ||
    annotation.type === 'TSTypeLiteral' ||
    annotation.type === 'TSIntersectionType'
  )
}

export const codeObjectParams = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          max: { type: 'integer', minimum: 1 },
          services: { type: 'boolean' },
          all: { type: 'boolean' },
          allow: optionsPatternSchema,
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
          max: maxParams = 1,
          all: allDeclarations = false,
          services: serviceMethods = false,
          allow: allowPattern,
        } = optionsFirst<CodeObjectParamsOptions>(context, {})

        for (const { name, node } of exportsCheckedFunctions(program, allDeclarations, serviceMethods, optionsPatterns(allowPattern))) {
          if (node.params.length <= maxParams && node.params.every(isObjectParam)) {
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
