import { defineRule } from '@oxlint/plugins'
import { astStaticString } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { CodeLiteralInOptions } from '../../types/code.types.ts'

export const codeLiteralIn = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
    defaultOptions: [{ allow: [] }],
    messages: {
      literalIn: "Avoid '{{key}}' in value; use Object.hasOwn() or a discriminated union.",
    },
  },
  createOnce(context) {
    let allow = new Set<string>()

    return {
      before() {
        allow = new Set(optionsFirst<CodeLiteralInOptions>(context, { allow: [] }).allow)
      },
      BinaryExpression(node) {
        if (node.operator !== 'in') {
          return
        }

        const key = astStaticString(node.left)

        if (key !== undefined && !allow.has(key)) {
          context.report({
            node: node.left,
            messageId: 'literalIn',
            data: { key },
          })
        }
      },
    }
  },
})
