import { defineRule } from '@oxlint/plugins'
import { lexicalTypeParametersNames } from '../shared/lexical-type-parameters.ts'
import { signaturesListeners, signaturesParameterAnnotation } from '../shared/signatures.ts'
import { typeAliasesCollect, typeAliasesResolvesTo } from '../shared/type-aliases.ts'
import type { DillonAntiSlopSignature } from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

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
    let aliases = new Map<string, ESTree.TSTypeAliasDeclaration>()

    return {
      Program(node) {
        aliases = typeAliasesCollect(node, false)
      },
      ...signaturesListeners((node: DillonAntiSlopSignature) => {
        const shadowed = lexicalTypeParametersNames(node, context.sourceCode.visitorKeys)

        for (const parameter of node.params) {
          const annotation = signaturesParameterAnnotation(parameter)

          if (
            annotation === null ||
            annotation === undefined ||
            !typeAliasesResolvesTo(annotation.typeAnnotation, {
              aliases,
              keyword: 'TSObjectKeyword',
              shadowed,
              unions: true,
              promises: false,
            })
          ) {
            continue
          }
          context.report({
            node: annotation.typeAnnotation,
            messageId: 'objectParameter',
            data: {
              parameter: parameter.type === 'Identifier'
                ? parameter.name
                : context.sourceCode.getText(parameter).replace(/\s*:\s*object\s*$/u, ''),
            },
          })
        }
      }),
    }
  },
})
