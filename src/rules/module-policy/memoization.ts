import { defineRule } from '@oxlint/plugins'
import { astDottedName } from '../../utils/index.ts'

/** Reject React memoization imports and member calls while leaving unrelated cache.memo calls alone. */
export const memoization = defineRule({
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
        for (const item of node.specifiers) {
          if (item.type === 'ImportSpecifier') {
            const name = item.imported.type === 'Identifier' ? item.imported.name : item.imported.value
            if (['memo', 'useMemo', 'useCallback'].includes(name)) {
              context.report({ node: item, messageId: 'memo' })
            }
          } else {
            namespaces.add(item.local.name)
          }
        }
      },
      MemberExpression(node) {
        const name = astDottedName(node)?.split('.')
        if (name?.length === 2 && namespaces.has(name[0]) && ['memo', 'useMemo', 'useCallback'].includes(name[1])) {
          context.report({ node, messageId: 'memo' })
        }
      },
    }
  },
})
