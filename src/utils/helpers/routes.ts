import { astCallName, astVisit } from './ast.ts'
import type { Context, ESTree } from '@oxlint/plugins'

export function routesInspectFunction(
  context: Context,
  item: { name: string, node: ESTree.Function | ESTree.ArrowFunctionExpression },
  bannedHooks: Set<string>,
  banIntrinsicJsx: boolean,
): void {
  astVisit(item.node.body, [item.node], (node) => {
    if (banIntrinsicJsx && node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier' && /^[a-z]/.test(node.name.name)) {
      context.report({
        node,
        messageId: 'hostJsx',
        data: { name: item.name },
      })
    }

    if (node.type === 'CallExpression') {
      const name = astCallName(node)

      if (name && bannedHooks.has(name)) {
        context.report({
          node,
          messageId: 'bannedHook',
          data: { hook: name, name: item.name },
        })
      }
    }
  })
}
