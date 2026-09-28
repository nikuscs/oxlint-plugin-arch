import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { optionsFirst } from '../utils/index.ts'

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
    let allowed: RegExp | null = null

    function check(node: ESTree.TSTypeAliasDeclaration | ESTree.TSInterfaceDeclaration) {
      if (allowed?.test(node.id.name)) {
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
        const { allowPattern } = optionsFirst<NoTypeDeclarationsOptions>(context, {})
        allowed = allowPattern ? new RegExp(allowPattern) : null
      },
      TSTypeAliasDeclaration: check,
      TSInterfaceDeclaration: check,
    }
  },
})
