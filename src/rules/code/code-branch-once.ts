import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { CodeBranchOnceOptions } from '../../types/code.types.ts'
import type { ESTree, SourceCode } from '@oxlint/plugins'

function codeBranchOnceSubjects(node: ESTree.Node, source: SourceCode): string[] {
  if (node.type === 'LogicalExpression') {
    return [...codeBranchOnceSubjects(node.left, source), ...codeBranchOnceSubjects(node.right, source)]
  }

  if (node.type === 'UnaryExpression' && node.operator === '!') {
    return codeBranchOnceSubjects(node.argument, source)
  }

  if (node.type !== 'BinaryExpression' || (node.operator !== '===' && node.operator !== '!==')) {
    return []
  }

  const sides = [node.left, node.right]
  const member = sides.find((side) => side.type === 'MemberExpression')
  const literal = sides.some((side) => side.type === 'Literal' && typeof side.value === 'string')
  return member && literal ? [source.getText(member)] : []
}

export const codeBranchOnce = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { min: { type: 'integer', minimum: 2, default: 2 } },
      },
    ],
    messages: {
      once: '{{subject}} is compared to a string in {{count}} ternaries in this file. Branch on it once and return a record.',
    },
  },
  createOnce(context) {
    let groups = new Map<string, ESTree.ConditionalExpression[]>()
    let min = 2

    return {
      before() {
        groups = new Map()
        min = optionsFirst<CodeBranchOnceOptions>(context, {}).min ?? 2
      },
      ConditionalExpression(node) {
        for (const subject of new Set(codeBranchOnceSubjects(node.test, context.sourceCode))) {
          groups.set(subject, [...(groups.get(subject) ?? []), node])
        }
      },
      'Program:exit'() {
        for (const [subject, ternaries] of groups) {
          for (const node of ternaries.length >= min ? ternaries : []) {
            context.report({
              node,
              messageId: 'once',
              data: { subject, count: String(ternaries.length) },
            })
          }
        }
      },
    }
  },
})
