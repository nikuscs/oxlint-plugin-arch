import { defineRule } from '@oxlint/plugins'
import { astMemberName, astModuleName } from '../../utils/ast.utils.ts'
import { boundariesDeclaredVariable } from '../../utils/boundaries.utils.ts'

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
    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'react') {
          return
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier' && reactMemoNames.includes(astModuleName(specifier.imported))) {
            context.report({ node: specifier, messageId: 'memo' })
          }
        }
      },
      MemberExpression(node) {
        if (node.object.type !== 'Identifier' || !reactMemoNames.includes(astMemberName(node) ?? '')) {
          return
        }

        const variable = boundariesDeclaredVariable(context.sourceCode.getScope(node), node.object.name)

        const isReact = variable
          ? variable.defs.some((def) => def.type === 'ImportBinding' && def.node.type !== 'ImportSpecifier' && def.parent?.type === 'ImportDeclaration' && def.parent.source.value === 'react')
          : node.object.name === 'React'

        if (isReact) {
          context.report({ node, messageId: 'memo' })
        }
      },
    }
  },
})
