import { defineRule } from '@oxlint/plugins'
import { astIsInlineFunction } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { CodeFunctionNestingOptions } from '../../types/code.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const codeFunctionNesting = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { max: { type: 'integer', minimum: 1, default: 4 } },
      },
    ],
    messages: {
      deep: 'Functions nest {{depth}} deep (max {{max}}). Name the inner step.',
    },
  },
  createOnce(context) {
    let max = 4

    const check = (node: ESTree.Node) => {
      let depth = 0

      for (let current: ESTree.Node | null = node; current; current = current.parent) {
        depth += current.type === 'FunctionDeclaration' || astIsInlineFunction(current) ? 1 : 0
      }

      if (depth === max + 1) {
        context.report({
          node,
          messageId: 'deep',
          data: { depth: String(depth), max: String(max) },
        })
      }
    }

    return {
      before() {
        max = optionsFirst<CodeFunctionNestingOptions>(context, {}).max ?? 4
      },
      ArrowFunctionExpression: check,
      FunctionExpression: check,
      FunctionDeclaration: check,
    }
  },
})
