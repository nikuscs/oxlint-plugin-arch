import { defineRule } from '@oxlint/plugins'
import { astModuleName } from '../../utils/ast.utils.ts'
import { boundariesDeclaredVariable, boundariesMemberName } from '../../utils/boundaries.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { ReactMemoOptions } from '../../types/react.types.ts'

export const reactMemo = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          names: { type: 'array', items: { type: 'string' } },
          sources: { type: 'array', items: { type: 'string' } },
          message: { type: 'string' },
        },
      },
    ],
    messages: {
      memo: '{{message}}',
    },
  },
  createOnce(context) {
    let names: string[] = []
    let sources: string[] = []
    let message = ''

    return {
      before() {
        const options = optionsFirst<ReactMemoOptions>(context, {})
        names = options.names ?? ['memo', 'useMemo', 'useCallback']
        sources = options.sources ?? ['react']
        message = options.message ?? 'Use the React Compiler rather than manual memoization.'
      },
      ImportDeclaration(node) {
        if (!sources.includes(node.source.value)) {
          return
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier' && names.includes(astModuleName(specifier.imported))) {
            context.report({
              node: specifier,
              messageId: 'memo',
              data: { message },
            })
          }
        }
      },
      MemberExpression(node) {
        if (node.object.type !== 'Identifier' || !names.includes(boundariesMemberName(node) ?? '')) {
          return
        }

        const variable = boundariesDeclaredVariable(context.sourceCode.getScope(node), node.object.name)

        const isReact = variable
          ? variable.defs.some((def) => def.type === 'ImportBinding' && (def.node.type !== 'ImportSpecifier' || astModuleName(def.node.imported) === 'default') && def.parent?.type === 'ImportDeclaration' && sources.includes(def.parent.source.value))
          : node.object.name === 'React' && sources.includes('react')

        if (isReact) {
          context.report({
            node,
            messageId: 'memo',
            data: { message },
          })
        }
      },
    }
  },
})
