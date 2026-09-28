import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { commentsIsDirective, commentsIsWhy, commentsNormalizedValue, optionsFirst } from '../utils/index.ts'

interface NoMemberCommentsOptions {
  allowWhy?: boolean
}

export const noMemberComments = defineRule({
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        allowWhy: { type: 'boolean', default: true },
      },
    }],
    messages: {
      memberComment: 'Remove this comment from the type member.',
    },
  },
  createOnce(context) {
    const reported = new Set<number>()

    type MemberNode =
      | ESTree.TSPropertySignature
      | ESTree.TSMethodSignature
      | ESTree.TSIndexSignature
      | ESTree.TSCallSignatureDeclaration
      | ESTree.TSConstructSignatureDeclaration
      | ESTree.ObjectProperty
      | ESTree.BindingProperty
      | ESTree.AssignmentTargetProperty
      | ESTree.SpreadElement

    function checkMember(node: MemberNode) {
        const parent = node.parent
        if (
          parent.type !== 'TSInterfaceBody'
          && parent.type !== 'TSTypeLiteral'
          && parent.type !== 'ObjectExpression'
        ) return

        const source = context.sourceCode
        const { allowWhy = true } = optionsFirst<NoMemberCommentsOptions>(context, {})
        const previousToken = source.getTokenBefore(node)
        const comments = [
          ...source.getCommentsBefore(node).filter(comment =>
            !previousToken || previousToken.range[0] === parent.range[0]
            || previousToken.loc.end.line !== comment.loc.start.line),
          ...source.getCommentsAfter(node).filter(comment => comment.loc.start.line === node.loc.end.line),
        ].filter(comment => comment.range[0] > parent.range[0] && comment.range[1] < parent.range[1])

        let whyContinuation = false
        let previousLine = -1
        const removable: typeof comments = []
        for (const comment of comments) {
          const value = commentsNormalizedValue(comment)
          const isWhy: boolean = commentsIsWhy(value)
            || (comment.type === 'Line' && whyContinuation && comment.loc.start.line === previousLine + 1)
          whyContinuation = comment.type === 'Line' && isWhy
          previousLine = comment.loc.end.line
          if (reported.has(comment.range[0])) continue
          reported.add(comment.range[0])
          if (allowWhy && isWhy) continue
          if (commentsIsDirective(value)) continue
          removable.push(comment)
        }

        // Why: oxlint applies one fix per overlapping range per pass, so a run of
        // stacked comments must be deleted by a single fix or `--fix` silently
        // leaves the tail behind and never converges.
        for (let index = 0; index < removable.length;) {
          let last = index
          while (
            last + 1 < removable.length
            && removable[last + 1].loc.start.line === removable[last].loc.end.line + 1
          ) last++

          const first = removable[index]
          const final = removable[last]
          index = last + 1

          context.report({
            loc: { start: first.loc.start, end: final.loc.end },
            messageId: 'memberComment',
            fix(fixer) {
              const text = source.text
              const lineStart = text.lastIndexOf('\n', first.range[0] - 1) + 1
              const before = text.slice(lineStart, first.range[0])
              // Why: a trailing comment sits behind the code's own spacing, so the
              // fix must eat that run of spaces too or every stripped inline
              // comment leaves trailing whitespace behind.
              const start = first.range[0] - (/[\t ]*$/.exec(before)?.[0].length ?? 0)
              const after = text.slice(final.range[1])
              const trailingLines = after.match(/^[\t ]*\r?\n(?:[\t ]*\r?\n)*/)
              if (trailingLines) {
                const end = final.range[1] + trailingLines[0].length
                if (/^[\t ]*$/.test(before)) return fixer.removeRange([lineStart, end])
                const newline = trailingLines[0].includes('\r\n') ? '\r\n' : '\n'
                return fixer.replaceTextRange([start, end], newline)
              }
              return fixer.removeRange([start, final.range[1]])
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
