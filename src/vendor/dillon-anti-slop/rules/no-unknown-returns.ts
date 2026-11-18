import { defineRule } from '@oxlint/plugins'
import { signaturesListeners } from '../shared/signatures.ts'
import { typeBindingsMatches, typeBindingsWith } from '../shared/type-bindings.ts'
import type { DillonAntiSlopSignature } from '../../../types/dillon-anti-slop.types.ts'

export const noUnknownReturnsRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow functions whose explicit return contract is unknown or Promise<unknown>.',
    },
    messages: {
      unknownReturn: 'This function exposes `unknown` to its caller. Parse the value at its boundary and return a named domain type.',
    },
  },
  createOnce(context) {
    return typeBindingsWith(context, (defer) =>
      signaturesListeners((node: DillonAntiSlopSignature) => {
        const type = node.returnType?.typeAnnotation

        if (type === undefined) {
          return
        }
        defer((environment) => {
          const isUnknown = typeBindingsMatches(type, environment, (resolved, matches) => {
            if (resolved.type === 'TSParenthesizedType') {
              return matches(resolved.typeAnnotation)
            }

            if (resolved.type === 'TSUnionType') {
              return resolved.types.some(matches)
            }

            if (
              resolved.type !== 'TSTypeReference' ||
              resolved.typeName.type !== 'Identifier' ||
              (resolved.typeName.name !== 'Promise' && resolved.typeName.name !== 'PromiseLike')
            ) {
              return resolved.type === 'TSUnknownKeyword'
            }

            const value = resolved.typeArguments?.params.at(0)

            return value !== undefined && matches(value)
          })

          if (isUnknown) {
            context.report({ node: type, messageId: 'unknownReturn' })
          }
        })
      }))
  },
})
