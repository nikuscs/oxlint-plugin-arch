import { defineRule } from '@oxlint/plugins'
import { typeBindingsMatches, typeBindingsWith } from '../shared/type-bindings.ts'

export const noUnknownTypeAliasesRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow type aliases whose resolved type is unknown; unknown must remain visible at an allowed boundary.',
    },
    messages: {
      unknownAlias: 'Type alias `{{alias}}` hides `unknown`. Keep `unknown` explicit at the parsing boundary or on an allowed `cause` field; otherwise use the parsed owner type.',
    },
  },
  createOnce(context) {
    return typeBindingsWith(context, (defer) => ({
      TSTypeAliasDeclaration(node) {
        defer((environment) => {
          const isUnknown = typeBindingsMatches(node.typeAnnotation, environment, (resolved, matches) => {
            if (resolved.type === 'TSParenthesizedType') {
              return matches(resolved.typeAnnotation)
            }

            return resolved.type === 'TSUnknownKeyword' || (resolved.type === 'TSUnionType' && resolved.types.some(matches))
          })

          if (isUnknown) {
            context.report({
              node: node.id,
              messageId: 'unknownAlias',
              data: { alias: node.id.name },
            })
          }
        })
      },
    }))
  },
})
