import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceCommentText, sourceIsDirective, sourceIsWhy } from '../../utils/source.utils.ts'
import type { CommentsMemberNode, CommentsMembersOptions } from '../../types/comments.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const commentsMembers = defineRule({
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowWhy: { type: 'boolean', default: true },
        },
      },
    ],
    messages: {
      memberComment: 'Remove this comment from the type member.',
    },
  },
  createOnce(context) {
    const reported = new Set<number>()

    function checkMember(node: CommentsMemberNode) {
      const parent = node.parent

      if (parent.type !== 'TSInterfaceBody' && parent.type !== 'TSTypeLiteral' && parent.type !== 'ObjectExpression') {
        return
      }

      const source = context.sourceCode
      const { allowWhy = true } = optionsFirst<CommentsMembersOptions>(context, {})
      let whyContinuation = false
      let previousLine = -1
      const removable: ESTree.Comment[] = []

      const previousToken = source.getTokenBefore(node)

      const before = source
        .getCommentsBefore(node)
        .filter(
          (comment) =>
            !previousToken || previousToken.range[0] === parent.range[0] || previousToken.loc.end.line !== comment.loc.start.line,
        )

      const after = source.getCommentsAfter(node).filter((comment) => comment.loc.start.line === node.loc.end.line)
      const comments = [...before, ...after].filter((comment) => comment.range[0] > parent.range[0] && comment.range[1] < parent.range[1])

      for (const comment of comments) {
        const text = sourceCommentText(comment)

        const isWhy: boolean =
          sourceIsWhy(text) || (comment.type === 'Line' && whyContinuation && comment.loc.start.line === previousLine + 1)

        whyContinuation = comment.type === 'Line' && isWhy
        previousLine = comment.loc.end.line
        if (reported.has(comment.range[0])) {
          continue
        }
        reported.add(comment.range[0])
        if ((allowWhy && isWhy) || sourceIsDirective(text)) {
          continue
        }
        removable.push(comment)
      }

      const runs: ESTree.Comment[][] = []

      for (const comment of removable) {
        const run = runs.at(-1)
        const previous = run?.at(-1)

        if (run && previous && comment.loc.start.line === previous.loc.end.line + 1) {
          run.push(comment)
        } else {
          runs.push([comment])
        }
      }

      for (const run of runs) {
        const [first] = run
        const final = run.at(-1) ?? first
        context.report({
          loc: { start: first.loc.start, end: final.loc.end },
          messageId: 'memberComment',
          fix: (fixer) => {
            const text = source.text
            const lineStart = text.lastIndexOf('\n', first.range[0] - 1) + 1
            const beforeComment = text.slice(lineStart, first.range[0])
            const start = first.range[0] - (/[\t ]*$/.exec(beforeComment)?.[0].length ?? 0)
            const trailingLines = /^[\t ]*\r?\n(?:[\t ]*\r?\n)*/.exec(text.slice(final.range[1]))

            if (!trailingLines) {
              return fixer.removeRange([start, final.range[1]])
            }

            const end = final.range[1] + trailingLines[0].length

            if (/^[\t ]*$/.test(beforeComment)) {
              return fixer.removeRange([lineStart, end])
            }

            return fixer.replaceTextRange([start, end], trailingLines[0].includes('\r\n') ? '\r\n' : '\n')
          },
        })
      }
    }

    return {
      Program() {
        reported.clear()
      },
      TSPropertySignature: checkMember,
      TSMethodSignature: checkMember,
      TSIndexSignature: checkMember,
      TSCallSignatureDeclaration: checkMember,
      TSConstructSignatureDeclaration: checkMember,
      Property: checkMember,
      SpreadElement: checkMember,
    }
  },
})
