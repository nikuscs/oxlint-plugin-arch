import { defineRule } from '@oxlint/plugins'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { TypesLocalAliasOptions } from '../../types/types.types.ts'

export const typesLocalAlias = defineRule({
  meta: {
    type: 'problem',
    schema: [{ type: 'object', additionalProperties: false, properties: { allow: optionsPatternSchema, message: { type: 'string' } } }],
    messages: { forbidden: '{{message}}' },
  },
  createOnce(context) {
    let allow: RegExp[] = []
    let message = ''

    return {
      before() {
        const options = optionsFirst<TypesLocalAliasOptions>(context, {})
        allow = optionsPatterns(options.allow)
        message =
          options.message ??
          'Local component/hook contracts use interfaces named for their owner. Derived or reusable aliases belong in domain types; do not substitute an empty interface.'
      },
      TSTypeAliasDeclaration(node) {
        if (!optionsPatternsTest(allow, node.id.name)) {
          context.report({
            node,
            messageId: 'forbidden',
            data: { message },
          })
        }
      },
    }
  },
})
