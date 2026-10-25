import { defineRule } from '@oxlint/plugins'
import { typeAliasesCollect, typeAliasesResolvesTo } from '../shared/type-aliases.ts'
import type { DillonAntiSlopAliasResolution } from '../../../types/dillon-anti-slop.types.ts'

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
    return {
      Program(node) {
        const aliases = typeAliasesCollect(node, true)

        const resolution: DillonAntiSlopAliasResolution = {
          aliases,
          keyword: 'TSUnknownKeyword',
          shadowed: new Set<string>(),
          unions: false,
          promises: false,
        }

        for (const alias of aliases.values()) {
          if (!typeAliasesResolvesTo(alias.typeAnnotation, resolution, new Set([alias.id.name]))) {
            continue
          }
          context.report({
            node: alias.id,
            messageId: 'unknownAlias',
            data: { alias: alias.id.name },
          })
        }
      },
    }
  },
})
