import { defineRule } from '@oxlint/plugins'
import { astCallDepth, astIsCall, astIsOneLine } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { AstCall } from '../../types/ast.types.ts'
import type { LayoutCallDepthOptions } from '../../types/layout.types.ts'
import type { ESTree } from '@oxlint/plugins'

function layoutCallDepthOuter(node: ESTree.Node): AstCall | undefined {
  const parent = node.parent

  if (!parent || parent.type === 'ArrowFunctionExpression' || parent.type === 'FunctionExpression' || parent.type.endsWith('Statement')) {
    return undefined
  }

  return astIsCall(parent) && parent.arguments.some((argument) => argument === node) ? parent : layoutCallDepthOuter(parent)
}

export const layoutCallDepth = defineRule({
  meta: {
    type: 'layout',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { max: { type: 'integer', minimum: 1, default: 2 } },
      },
    ],
    messages: {
      deep: 'Calls nest {{depth}} deep on one line (max {{max}}). Break the outer call or name an inner value.',
    },
  },
  createOnce(context) {
    let max = 2

    const check = (node: AstCall) => {
      const depth = astCallDepth(node)
      const outer = layoutCallDepthOuter(node)

      if (!astIsOneLine(node) || depth <= max || (outer !== undefined && astIsOneLine(outer) && astCallDepth(outer) > max)) {
        return
      }

      context.report({
        node,
        messageId: 'deep',
        data: { depth: String(depth), max: String(max) },
      })
    }

    return {
      before() {
        max = optionsFirst<LayoutCallDepthOptions>(context, {}).max ?? 2
      },
      CallExpression: check,
      NewExpression: check,
    }
  },
})
