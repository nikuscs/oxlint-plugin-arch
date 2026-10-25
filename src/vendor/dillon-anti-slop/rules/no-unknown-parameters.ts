import { defineRule } from '@oxlint/plugins'
import { signaturesListeners, signaturesParameterAnnotation } from '../shared/signatures.ts'
import type { DillonAntiSlopSignature } from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

function parameterName(parameter: ESTree.ParamPattern, sourceText: string): string {
  if (parameter.type === 'TSParameterProperty') {
    return parameterName(parameter.parameter, sourceText)
  }

  if (parameter.type === 'AssignmentPattern') {
    return parameterName(parameter.left, sourceText)
  }

  if (parameter.type === 'RestElement') {
    return parameterName(parameter.argument, sourceText)
  }

  return parameter.type === 'Identifier' ? parameter.name : sourceText.replace(/\s*:\s*unknown\s*$/u, '')
}

export const noUnknownParametersRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow explicitly unknown function parameters except `error` and `cause`; decode unknown input at its I/O boundary instead.',
    },
    messages: {
      unknownParameter: 'Parameter `{{parameter}}` leaves input unparsed. Accept a named domain type; run the expected schema or parser at the I/O boundary before calling this function.',
    },
  },
  createOnce(context) {
    return signaturesListeners((node: DillonAntiSlopSignature) => {
      for (const parameter of node.params) {
        const annotation = signaturesParameterAnnotation(parameter)

        if (annotation?.typeAnnotation.type !== 'TSUnknownKeyword') {
          continue
        }

        const name = parameterName(parameter, context.sourceCode.getText(parameter))

        if (name === 'cause' || name === 'error') {
          continue
        }
        context.report({
          node: annotation.typeAnnotation,
          messageId: 'unknownParameter',
          data: { parameter: name },
        })
      }
    })
  },
})
