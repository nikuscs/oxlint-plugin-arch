import { defineRule } from '@oxlint/plugins'
import { astCallDepth, astIsCall, astIsOneLine } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { AstCall } from '../../types/ast.types.ts'
import type { LayoutCallDepthOptions } from '../../types/layout.types.ts'
import type { ESTree } from '@oxlint/plugins'

function layoutCallDepthOuter(node: ESTree.Node, callbacks: boolean): AstCall | undefined {
  const parent = node.parent

  if (!parent || (!callbacks && (parent.type === 'ArrowFunctionExpression' || parent.type === 'FunctionExpression')) || parent.type.endsWith('Statement')) {
    return undefined
  }

  return astIsCall(parent) && parent.arguments.some((argument) => argument === node) ? parent : layoutCallDepthOuter(parent, callbacks)
}

export const layoutCallDepth = defineRule({
  meta: {
    type: 'layout',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { max: { type: 'integer', minimum: 1, default: 2 }, callbacks: { type: 'boolean', default: false } },
      },
    ],
    messages: {
      deep: 'Calls nest {{depth}} deep on one line (max {{max}}). Break the outer call or name an inner value.',
    },
  },
  createOnce(context) {
    let max = 2
    let callbacks = false

    const check = (node: AstCall) => {
      const depth = astCallDepth(node, callbacks)
      const outer = layoutCallDepthOuter(node, callbacks)

      if (!astIsOneLine(node) || depth <= max || (outer !== undefined && astIsOneLine(outer) && astCallDepth(outer, callbacks) > max)) {
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
        const options = optionsFirst<LayoutCallDepthOptions>(context, {})
        max = options.max ?? 2
        callbacks = options.callbacks ?? false
      },
      CallExpression: check,
      NewExpression: check,
    }
  },
})
