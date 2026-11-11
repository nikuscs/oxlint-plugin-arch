import { defineRule } from '@oxlint/plugins'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { TypesDeclarationNode, TypesDeclarationsOptions } from '../../types/types.types.ts'
import type { ESTree } from '@oxlint/plugins'

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
          modules: { type: 'boolean' },
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
    let allowModules = false

    function check(node: TypesDeclarationNode) {
      let ancestor: ESTree.Node | null = node.parent

      while (allowModules && ancestor && ancestor.type !== 'TSModuleDeclaration') {
        ancestor = ancestor.parent
      }

      const ambient = ancestor?.type === 'TSModuleDeclaration' && (ancestor.kind === 'global' || ancestor.id.type === 'Literal')

      if (
        (allowModules && ambient) ||
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
        const { allow: allowPattern, modules = false } = optionsFirst<TypesDeclarationsOptions>(context, {})
        allowModules = modules
        const sources = allowPattern === undefined ? [] : [allowPattern].flat()
        allowedNames = optionsPatterns(sources.filter((source) => !isValuePattern(source)))
        allowedValues = optionsPatterns(sources.filter(isValuePattern))
      },
      TSTypeAliasDeclaration: check,
      TSInterfaceDeclaration: check,
    }
  },
})
