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
          allowPattern: optionsPatternSchema,
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
      const allowedValue =
        node.type === 'TSTypeAliasDeclaration' &&
        allowedValues.length > 0 &&
        optionsPatternsTest(allowedValues, `= ${context.sourceCode.getText(node.typeAnnotation)}`)

      if (optionsPatternsTest(allowedNames, node.id.name) || allowedValue) {
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
        const { allowPattern } = optionsFirst<TypesDeclarationsOptions>(context, {})
        const sources = allowPattern === undefined ? [] : [allowPattern].flat()
        allowedNames = optionsPatterns(sources.filter((source) => !isValuePattern(source)))
        allowedValues = optionsPatterns(sources.filter(isValuePattern))
      },
      TSTypeAliasDeclaration: check,
      TSInterfaceDeclaration: check,
    }
  },
})
