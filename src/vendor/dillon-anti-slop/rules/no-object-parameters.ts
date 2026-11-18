import { defineRule } from '@oxlint/plugins'
import { signaturesListeners, signaturesParameterAnnotation, signaturesParameterName } from '../shared/signatures.ts'
import { typeBindingsMatches, typeBindingsWith } from '../shared/type-bindings.ts'
import type { DillonAntiSlopSignature } from '../../../types/dillon-anti-slop.types.ts'

export const noObjectParametersRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow object function parameters; inputs must use an owner-provided type and be parsed at their boundary.',
    },
    messages: {
      objectParameter: 'Parameter `{{parameter}}` uses the broad `object` type. Accept a named owner type; parse external input at its boundary before calling this function.',
    },
  },
  createOnce(context) {
    return typeBindingsWith(context, (defer) =>
      signaturesListeners((node: DillonAntiSlopSignature) => {
        for (const parameter of node.params) {
          const type = signaturesParameterAnnotation(parameter)?.typeAnnotation

          if (type === undefined) {
            continue
          }
          defer((environment) => {
            const isObject = typeBindingsMatches(type, environment, (resolved, matches) => {
              if (resolved.type === 'TSParenthesizedType') {
                return matches(resolved.typeAnnotation)
              }

              return resolved.type === 'TSObjectKeyword' || (resolved.type === 'TSUnionType' && resolved.types.some(matches))
            })

            if (isObject) {
              context.report({
                node: type,
                messageId: 'objectParameter',
                data: { parameter: signaturesParameterName(parameter, context.sourceCode) },
              })
            }
          })
        }
      }))
  },
})
