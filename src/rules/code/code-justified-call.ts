import { defineRule } from '@oxlint/plugins'
import { astDottedName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { CodeJustifiedCallOptions } from '../../types/code.types.ts'
import type { Comment } from '@oxlint/plugins'

export const codeJustifiedCall = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        required: ['calls'],
        properties: {
          calls: { type: 'array', items: { type: 'string' }, minItems: 1 },
          comment: { type: 'string', default: 'SAFETY:' },
          message: { type: 'string' },
        },
      },
    ],
    messages: {
      missing: '{{call}} needs a `// {{comment}} <why>` comment on the line above.{{message}}',
    },
  },
  createOnce(context) {
    let calls = new Set<string>()
    let comment = 'SAFETY:'
    let message = ''
    let comments: Comment[] = []

    const justified = (line: number): boolean => {
      const above = comments.find((candidate) => candidate.loc.end.line === line - 1)

      if (!above) {
        return false
      }

      return above.value.trimStart().startsWith(`${comment} `) || (above.type === 'Line' && justified(above.loc.start.line))
    }

    return {
      before() {
        const options = optionsFirst<CodeJustifiedCallOptions>(context, { calls: [] })
        calls = new Set(options.calls)
        comment = options.comment ?? 'SAFETY:'
        message = options.message ? ` ${options.message}` : ''
        comments = context.sourceCode.getAllComments()
      },
      CallExpression(node) {
        const call = astDottedName(node.callee)

        if (call && calls.has(call) && !justified(node.loc.start.line)) {
          context.report({
            node,
            messageId: 'missing',
            data: { call, comment, message },
          })
        }
      },
    }
  },
})
