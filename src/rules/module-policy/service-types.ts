import { defineRule } from '@oxlint/plugins'

/** Only the matching factory-derived Service alias stays local; ChatDeps belongs in domain types. */
export const serviceTypes = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      domain:
        'Move this type to its domain types file; only the matching factory-derived Service alias belongs here.',
    },
  },
  createOnce(context) {
    return {
      TSInterfaceDeclaration(node) {
        context.report({ node, messageId: 'domain' })
      },
      TSTypeAliasDeclaration(node) {
        const type = node.typeAnnotation
        const argument =
          type.type === 'TSTypeReference'
            ? type.typeArguments?.params[0]
            : undefined
        const factory =
          argument?.type === 'TSTypeQuery' &&
          argument.exprName.type === 'Identifier'
            ? argument.exprName.name
            : undefined
        if (
          node.id.name.endsWith('Service') &&
          type.type === 'TSTypeReference' &&
          type.typeName.type === 'Identifier' &&
          type.typeName.name === 'ReturnType' &&
          type.typeArguments?.params.length === 1 &&
          factory === `make${node.id.name}`
        ) {
          return
        }
        context.report({ node, messageId: 'domain' })
      },
    }
  },
})
