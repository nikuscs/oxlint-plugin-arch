import { defineRule } from '@oxlint/plugins'
import { astDottedName, astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { NamingPairsOptions } from '../../types/naming.types.ts'
import type { ESTree } from '@oxlint/plugins'

function namingPairsArguments(node: ESTree.Node, found: Map<string, ESTree.Node>): Map<string, ESTree.Node> {
  if (node.type === 'MemberExpression') {
    return namingPairsArguments(node.object, found)
  }

  if (node.type !== 'CallExpression') {
    return found
  }

  const method = node.callee.type === 'MemberExpression' ? astMemberName(node.callee) : undefined
  const first = node.arguments.at(0)

  if (method !== undefined && first && !found.has(method)) {
    found.set(method, first)
  }

  return namingPairsArguments(node.callee, found)
}

export const namingPairs = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          pairs: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                methods: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 },
                strip: optionsPatternSchema,
                allow: optionsPatternSchema,
              },
              required: ['methods'],
            },
          },
        },
        required: ['pairs'],
      },
    ],
    messages: {
      pair: "'{{second}}' in .{{secondMethod}}() must share its name with '{{first}}' in .{{firstMethod}}().",
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const parent = node.parent
        const chained = (parent.type === 'MemberExpression' && parent.object === node) || (parent.type === 'CallExpression' && parent.callee === node)
        const { pairs } = optionsFirst<NamingPairsOptions>(context, { pairs: [] })

        if (chained || pairs.length === 0) {
          return
        }

        const found = namingPairsArguments(node, new Map())

        for (const { methods: [firstMethod, secondMethod], strip, allow } of pairs) {
          const firstNode = found.get(firstMethod)
          const secondNode = found.get(secondMethod)
          const first = firstNode ? astDottedName(firstNode)?.split('.').at(-1) : undefined
          const second = secondNode ? astDottedName(secondNode)?.split('.').at(-1) : undefined
          const skipped = optionsPatterns(allow)
          const stem = (name: string) => optionsPatterns(strip).reduce((text, pattern) => text.replace(pattern, ''), name)

          if (!secondNode || first === undefined || second === undefined || optionsPatternsTest(skipped, first) || optionsPatternsTest(skipped, second)) {
            continue
          }

          if (stem(first) !== stem(second)) {
            context.report({
              node: secondNode,
              messageId: 'pair',
              data: { first, second, firstMethod, secondMethod },
            })
          }
        }
      },
    }
  },
})
