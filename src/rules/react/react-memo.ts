import { defineRule } from '@oxlint/plugins'
import { astDottedName } from '../../utils/ast.utils.ts'

const reactMemoNames = ['memo', 'useMemo', 'useCallback']

export const reactMemo = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      memo: 'Use the React Compiler rather than manual memoization.',
    },
  },
  createOnce(context) {
    let namespaces = new Set<string>()
    return {
      before() {
        namespaces = new Set(['React'])
      },
      ImportDeclaration(node) {
        if (node.source.value !== 'react') {
          return
        }

        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') {
            namespaces.add(specifier.local.name)
            continue
          }

          const name = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value

          if (reactMemoNames.includes(name)) {
            context.report({ node: specifier, messageId: 'memo' })
          }
        }
      },
      MemberExpression(node) {
        const parts = astDottedName(node)?.split('.')

        if (parts?.length === 2 && namespaces.has(parts[0]) && reactMemoNames.includes(parts[1])) {
          context.report({ node, messageId: 'memo' })
        }
      },
    }
  },
})
