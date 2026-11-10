import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { TypesServiceOptions } from '../../types/types.types.ts'

export const typesService = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          suffix: { type: 'string', minLength: 1, default: 'Service' },
          factory: { type: 'string', minLength: 1, default: 'make' },
        },
      },
    ],
    messages: {
      domain: 'Move this type to its domain types file; only the matching factory-derived {{suffix}} alias belongs here.',
    },
  },
  createOnce(context) {
    let suffix = 'Service'
    let factory = 'make'

    return {
      before() {
        const options = optionsFirst<TypesServiceOptions>(context, {})
        suffix = options.suffix ?? 'Service'
        factory = options.factory ?? 'make'
      },
      TSInterfaceDeclaration(node) {
        context.report({
          node,
          messageId: 'domain',
          data: { suffix },
        })
      },
      TSTypeAliasDeclaration(node) {
        const type = node.typeAnnotation
        const argument = type.type === 'TSTypeReference' && type.typeArguments?.params.length === 1 ? type.typeArguments.params[0] : undefined

        const isFactoryService =
          node.id.name.endsWith(suffix) &&
          type.type === 'TSTypeReference' &&
          type.typeName.type === 'Identifier' &&
          type.typeName.name === 'ReturnType' &&
          argument?.type === 'TSTypeQuery' &&
          argument.exprName.type === 'Identifier' &&
          argument.exprName.name === `${factory}${node.id.name}`

        if (!isFactoryService) {
          context.report({
            node,
            messageId: 'domain',
            data: { suffix },
          })
        }
      },
    }
  },
})
