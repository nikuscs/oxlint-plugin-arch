import { defineRule } from '@oxlint/plugins'
import { astDottedName, astMemberName } from '../../utils/ast.utils.ts'
import type { ESTree } from '@oxlint/plugins'

function effectYieldsFirstService(statement: ESTree.Statement): string | undefined {
  const init = statement.type === 'VariableDeclaration' && statement.declarations.length === 1 ? statement.declarations[0].init : null
  const argument = init?.type === 'YieldExpression' && init.delegate ? init.argument : null

  return argument?.type === 'MemberExpression' && /^[A-Z]/.test(astMemberName(argument) ?? '') ? astDottedName(argument) : undefined
}

export const effectYieldsFirst = defineRule({
  meta: {
    type: 'suggestion',
    messages: {
      first: 'Yield {{source}} with the other dependencies, at the top of the function.',
    },
  },
  createOnce(context) {
    return {
      FunctionExpression(node) {
        if (!node.generator || !node.body) {
          return
        }

        let started = false

        for (const statement of node.body.body) {
          const source = effectYieldsFirstService(statement)

          if (source === undefined) {
            started = true
          } else if (started) {
            context.report({
              node: statement,
              messageId: 'first',
              data: { source },
            })
          }
        }
      },
    }
  },
})
