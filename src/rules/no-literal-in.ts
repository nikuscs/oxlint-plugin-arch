import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { optionsFirst } from '../utils/index.ts'

interface NoLiteralInOptions {
  allow: string[]
}

function literalKey(node: ESTree.Expression): string | undefined {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? node.quasis[0]?.value.raw
  }
}

/**
 * Rejects literal keys used with `in` in favor of explicit own-property or union checks.
 *
 * Example: `'kind' in value` fails; `Object.hasOwn(value, 'kind')` passes.
 */
export const noLiteralIn = defineRule({
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
        allow = new Set(optionsFirst<NoLiteralInOptions>(context, { allow: [] }).allow)
      },
      BinaryExpression(node) {
        if (node.operator !== 'in') {
          return
        }

        const key = literalKey(node.left)
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
