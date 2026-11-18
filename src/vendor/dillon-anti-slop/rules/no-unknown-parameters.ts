import { defineRule } from '@oxlint/plugins'
import { signaturesListeners, signaturesParameterAnnotation, signaturesParameterName } from '../shared/signatures.ts'
import type { DillonAntiSlopSignature } from '../../../types/dillon-anti-slop.types.ts'

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

        const name = signaturesParameterName(parameter, context.sourceCode)

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
