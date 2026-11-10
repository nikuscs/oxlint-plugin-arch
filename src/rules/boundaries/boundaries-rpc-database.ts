import { defineRule } from '@oxlint/plugins'
import { astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { BoundariesRpcDatabaseOptions } from '../../types/boundaries.types.ts'

const boundariesRpcDatabaseMethods = ['selectFrom', 'insertInto', 'updateTable', 'deleteFrom', 'mergeInto', 'executeQuery']

export const boundariesRpcDatabase = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          message: { type: 'string' },
          methods: { type: 'array', items: { type: 'string', minLength: 1 }, default: boundariesRpcDatabaseMethods },
        },
      },
    ],
    messages: { forbidden: '{{message}}' },
  },
  createOnce(context) {
    let message = ''
    let methods = new Set<string>()

    return {
      before() {
        const options = optionsFirst<BoundariesRpcDatabaseOptions>(context, {})
        message = options.message ?? 'RPC handlers delegate database work to services.'
        methods = new Set(options.methods ?? boundariesRpcDatabaseMethods)
      },
      CallExpression(node) {
        const callee = node.callee

        if (callee.type !== 'MemberExpression') {
          return
        }

        const property = callee.property
        const literal = property.type === 'Literal' && typeof property.value === 'string' ? property.value : undefined
        const name = callee.computed ? literal : astMemberName(callee)

        if (name !== undefined && methods.has(name)) {
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
