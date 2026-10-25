import { defineRule } from '@oxlint/plugins'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { TypesDeclarationNode, TypesDeclarationsOptions } from '../../types/types.types.ts'

function isValuePattern(source: string): boolean {
  return /^\^?=/.test(source)
}

export const typesDeclarations = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: optionsPatternSchema,
        },
      },
    ],
    messages: {
      typeDeclaration: "Type '{{name}}' must not be declared in this file.",
    },
  },
  createOnce(context) {
    let allowedNames: RegExp[] = []
    let allowedValues: RegExp[] = []

    function check(node: TypesDeclarationNode) {
      if (
        optionsPatternsTest(allowedNames, node.id.name) ||
        (node.type === 'TSTypeAliasDeclaration' &&
          allowedValues.length > 0 &&
          optionsPatternsTest(allowedValues, `= ${context.sourceCode.getText(node.typeAnnotation)}`))
      ) {
        return
      }
      context.report({
        node,
        messageId: 'typeDeclaration',
        data: { name: node.id.name },
      })
    }

    return {
      before() {
        const { allow: allowPattern } = optionsFirst<TypesDeclarationsOptions>(context, {})
        const sources = allowPattern === undefined ? [] : [allowPattern].flat()
        allowedNames = optionsPatterns(sources.filter((source) => !isValuePattern(source)))
        allowedValues = optionsPatterns(sources.filter(isValuePattern))
      },
      TSTypeAliasDeclaration: check,
      TSInterfaceDeclaration: check,
    }
  },
})
