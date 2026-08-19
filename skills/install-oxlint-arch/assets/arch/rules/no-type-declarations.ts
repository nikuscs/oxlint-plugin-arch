import { defineRule } from '@oxlint/plugins'
import { declarationsCollectNamed, optionsFirst } from '../utils/index.ts'

interface NoTypeDeclarationsOptions {
  allowPattern?: string
}

/**
 * Rejects type aliases and interfaces in matched files, with an optional name escape.
 *
 * Example: `interface User {}` fails in an API module; `type AccessRequestErrorKind = 'x'` can pass with `allowPattern: 'ErrorKind$'`.
 */
export const noTypeDeclarations = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        allowPattern: { type: 'string' },
      },
    }],
    messages: {
      typeDeclaration: "Type '{{name}}' must not be declared in this file.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { allowPattern } = optionsFirst<NoTypeDeclarationsOptions>(context, {})
        const allowed = allowPattern ? new RegExp(allowPattern) : null

        for (const item of declarationsCollectNamed(program)) {
          if ((item.node.type !== 'TSTypeAliasDeclaration' && item.node.type !== 'TSInterfaceDeclaration')
            || allowed?.test(item.name)) {
            continue
          }

          context.report({
            node: item.node,
            messageId: 'typeDeclaration',
            data: { name: item.name },
          })
        }
      },
    }
  },
})
