import { defineRule } from '@oxlint/plugins'

export const typesService = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      domain: 'Move this type to its domain types file; only the matching factory-derived Service alias belongs here.',
    },
  },
  createOnce(context) {
    return {
      TSInterfaceDeclaration(node) {
        context.report({ node, messageId: 'domain' })
      },
      TSTypeAliasDeclaration(node) {
        const type = node.typeAnnotation
        const argument = type.type === 'TSTypeReference' && type.typeArguments?.params.length === 1 ? type.typeArguments.params[0] : undefined

        const isFactoryService =
          node.id.name.endsWith('Service') &&
          type.type === 'TSTypeReference' &&
          type.typeName.type === 'Identifier' &&
          type.typeName.name === 'ReturnType' &&
          argument?.type === 'TSTypeQuery' &&
          argument.exprName.type === 'Identifier' &&
          argument.exprName.name === `make${node.id.name}`

        if (!isFactoryService) {
          context.report({ node, messageId: 'domain' })
        }
      },
    }
  },
})
