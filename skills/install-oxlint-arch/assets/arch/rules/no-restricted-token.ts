import { defineRule } from '@oxlint/plugins'
import { namingPosixPath, optionsFirst } from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface NoRestrictedTokenOptions {
  token: string
  allowIn: string[]
  allowPathPatterns?: string[]
}

function tokenIsTypeOnlyImport(node: ESTree.Node): boolean {
  const parent = node.parent

  if (parent?.type === 'ImportSpecifier') {
    return parent.importKind === 'type'
      || (parent.parent.type === 'ImportDeclaration' && parent.parent.importKind === 'type')
  }

  return (parent?.type === 'ImportDefaultSpecifier' || parent?.type === 'ImportNamespaceSpecifier')
    && parent.parent.type === 'ImportDeclaration'
    && parent.parent.importKind === 'type'
}

/**
 * Restricts one identifier to configured owner paths while leaving path selection to the consumer.
 *
 * Example: `RouterClient` can be allowed in `rpc.client.ts` and rejected everywhere else.
 */
export const noRestrictedToken = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        token: { type: 'string' },
        allowIn: { type: 'array', items: { type: 'string' } },
        allowPathPatterns: { type: 'array', items: { type: 'string' } },
      },
      required: ['token', 'allowIn'],
    }],
    messages: {
      restricted: "'{{token}}' may only appear in configured owner paths.",
    },
  },
  createOnce(context) {
    return {
      before() {
        const options = optionsFirst<NoRestrictedTokenOptions>(context)
        const filename = namingPosixPath(context.filename)
        const allowed = options.allowIn.some((suffix) => filename.endsWith(suffix))
          || (options.allowPathPatterns ?? []).some((pattern) => new RegExp(pattern).test(filename))

        if (allowed) {
          return false
        }
      },
      Identifier(node) {
        const { token } = optionsFirst<NoRestrictedTokenOptions>(context)

        if (node.name === token && !tokenIsTypeOnlyImport(node)) {
          context.report({
            node,
            messageId: 'restricted',
            data: { token },
          })
        }
      },
    }
  },
})
