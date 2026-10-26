import { defineRule } from '@oxlint/plugins'
import { lexicalTypeParametersNames } from '../shared/lexical-type-parameters.ts'
import { signaturesListeners } from '../shared/signatures.ts'
import { typeAliasesCollect, typeAliasesResolvesTo } from '../shared/type-aliases.ts'
import type { DillonAntiSlopSignature } from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

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
    let aliases = new Map<string, ESTree.TSTypeAliasDeclaration>()

    return {
      Program(node) {
        aliases = typeAliasesCollect(node, true)
      },
      ...signaturesListeners((node: DillonAntiSlopSignature) => {
        const annotation = node.returnType

        if (
          annotation === null ||
          annotation === undefined ||
          !typeAliasesResolvesTo(annotation.typeAnnotation, {
            aliases,
            keyword: 'TSUnknownKeyword',
            shadowed: lexicalTypeParametersNames(node, context.sourceCode.visitorKeys),
            unions: true,
            promises: true,
          })
        ) {
          return
        }
        context.report({ node: annotation.typeAnnotation, messageId: 'unknownReturn' })
      }),
    }
  },
})
