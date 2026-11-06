import { defineRule } from '@oxlint/plugins'
import { astIsCall, astIsOneLine } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceLineEnd } from '../../utils/source.utils.ts'
import type { LayoutArrowBodyOptions } from '../../types/layout.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const layoutArrowBody = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { max: { type: 'integer', minimum: 1, default: 160 } },
      },
    ],
    messages: {
      sameLine: 'Start the arrow body on the same line as =>. When the line is too long, break its arguments.',
    },
  },
  createOnce(context) {
    let max = 160

    return {
      before() {
        max = optionsFirst<LayoutArrowBodyOptions>(context, {}).max ?? 160
      },
      ArrowFunctionExpression(node) {
        const source = context.sourceCode
        const body = node.body
        const arrow = source.getTokenBefore(body, { filter: (token) => token.value === '=>' })
        const next = arrow ? source.getTokenAfter(arrow) : null

        if (body.type === 'BlockStatement' || !arrow || !next || next.loc.start.line === arrow.loc.end.line || source.commentsExistBetween(arrow, next)) {
          return
        }

        let root: ESTree.Node = body
        let calls = 0

        while (root.type === 'CallExpression' && root.callee.type === 'MemberExpression') {
          calls += 1
          root = root.callee.object
        }

        const open = astIsCall(body) && astIsOneLine(body) ? source.getTokenAfter(body.typeArguments ?? body.callee) : null
        const callEnd = open ? open.range[1] : sourceLineEnd(source.text, next.range[0])
        const headEnd = calls >= 2 && astIsOneLine(body) ? root.range[1] : callEnd

        if (arrow.loc.end.column + 1 + source.text.slice(next.range[0], headEnd).length > max) {
          return
        }

        context.report({
          node: body,
          messageId: 'sameLine',
          fix: (fixer) => fixer.replaceTextRange([arrow.range[1], next.range[0]], ' '),
        })
      },
    }
  },
})
