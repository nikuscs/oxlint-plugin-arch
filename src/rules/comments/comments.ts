import { defineRule } from '@oxlint/plugins'
import { astVisit } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import {
  sourceCommentText,
  sourceDisableNextLine,
  sourceIsDirective,
  sourceIsJsdoc,
  sourceIsWhy,
} from '../../utils/source.utils.ts'
import type { CommentsLines, CommentsOptions } from '../../types/comments.types.ts'
import type { ESTree } from '@oxlint/plugins'

const commentsLineGap = /^[\t \r\n\u2028\u2029]*$/
const commentsLineTerminator = /\r\n|[\n\r\u2028\u2029]/
const commentsUnicodeTerminator = /[\u2028\u2029]/
const commentsTrailingLines = /^[\t ]*(?:\r\n|[\n\r\u2028\u2029])(?:[\t ]*(?:\r\n|[\n\r\u2028\u2029]))*/
const commentsHorizontalSpace = /^[\t ]*$/

function commentsLines(text: string): CommentsLines {
  const starts = [0]
  const ends: number[] = []

  for (let index = 0; index < text.length; index++) {
    const character = text[index]

    if (character === '\r') {
      ends.push(index)
      if (text[index + 1] === '\n') {
        index++
      }
      starts.push(index + 1)
    } else if (character === '\n' || character === '\u2028' || character === '\u2029') {
      ends.push(index)
      starts.push(index + 1)
    }
  }
  ends.push(text.length)

  return { starts, ends }
}

function commentsBisect<T>(items: readonly T[], before: (item: T) => boolean): number {
  let low = 0
  let high = items.length

  while (low < high) {
    const middle = (low + high) >>> 1

    if (before(items[middle])) {
      low = middle + 1
    } else {
      high = middle
    }
  }

  return low
}

function commentsLineNumber(lines: CommentsLines, offset: number): number {
  return commentsBisect(lines.starts, (start) => start <= offset) - 1
}

function commentsFollowsOpeningBrace(text: string, offset: number): boolean {
  for (let index = offset - 1; index >= 0; index--) {
    if (!/\s/.test(text[index])) {
      return text[index] === '{'
    }
  }
  return false
}

export const comments = defineRule({
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowWhy: { type: 'boolean', default: true },
          allowPatterns: { type: 'array', items: { type: 'string' } },
          allowJsdoc: { type: 'boolean', default: false },
        },
      },
    ],
    messages: {
      comment: 'Remove this comment.',
    },
  },
  createOnce(context) {
    let allowWhy = true
    let allowJsdoc = false
    let allowed: RegExp[] = []

    return {
      before() {
        const options = optionsFirst<CommentsOptions>(context, {})
        allowWhy = options.allowWhy ?? true
        allowJsdoc = options.allowJsdoc ?? false
        allowed = (options.allowPatterns ?? []).map((pattern) => new RegExp(pattern))
      },
      Program(program) {
        const text = context.sourceCode.text
        const removable: ESTree.Comment[] = []
        const protectedLines: number[] = []
        let mightContainJsxComment = false
        let whyContinuation = false
        let previous: ESTree.Comment | undefined

        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.type === 'Shebang') {
            continue
          }

          const value = sourceCommentText(comment)

          if (comment.type === 'Block' && commentsFollowsOpeningBrace(text, comment.range[0])) {
            mightContainJsxComment = true
          }

          const followsPrevious =
            previous !== undefined &&
            comment.loc.start.line === previous.loc.end.line + 1 &&
            commentsLineGap.test(text.slice(previous.range[1], comment.range[0]))

          const isWhy: boolean = sourceIsWhy(value) || (comment.type === 'Line' && whyContinuation && followsPrevious)

          if (sourceDisableNextLine.test(value)) {
            protectedLines.push(comment.loc.end.line + 1)
          }
          whyContinuation = comment.type === 'Line' && isWhy
          previous = comment

          if (allowWhy && isWhy) {
            continue
          }

          if (sourceIsDirective(value)) {
            continue
          }

          if (allowJsdoc && sourceIsJsdoc(text, comment)) {
            continue
          }

          if (allowed.some((pattern) => pattern.test(value.trim()))) {
            continue
          }
          removable.push(comment)
        }

        if (removable.length === 0) {
          return
        }

        const lines = commentsLines(text)
        const jsxContainers: ESTree.JSXExpressionContainer[] = []

        if (mightContainJsxComment) {
          astVisit(program, [], (node) => {
            if (node.type === 'JSXExpressionContainer' && node.expression.type === 'JSXEmptyExpression') {
              jsxContainers.push(node)
            }
          })
          jsxContainers.sort((left, right) => left.range[0] - right.range[0])
        }

        const groups: ESTree.Comment[][] = []

        for (const comment of removable) {
          const group = groups.at(-1)
          const last = group?.at(-1)

          if (group && last && commentsLineGap.test(text.slice(last.range[1], comment.range[0]))) {
            group.push(comment)
          } else {
            groups.push([comment])
          }
        }

        for (const group of groups) {
          const [first] = group
          const final = group.at(-1) ?? first
          const range: [number, number] = [first.range[0], final.range[1]]

          const container = commentsBisect(jsxContainers, (candidate) => candidate.range[0] <= range[0]) - 1

          const reportOnly =
            (container >= 0 && jsxContainers[container].range[1] >= range[1]) ||
            protectedLines[commentsBisect(protectedLines, (line) => line < first.loc.start.line)] <= final.loc.end.line

          const unicodeBlock = group.find(
            (comment) => comment.type === 'Block' && commentsUnicodeTerminator.test(text.slice(...comment.range)),
          )

          const unicodeTerminator = unicodeBlock && commentsUnicodeTerminator.exec(text.slice(...unicodeBlock.range))?.[0]
          context.report({
            loc: { start: first.loc.start, end: final.loc.end },
            messageId: 'comment',
            fix: reportOnly
              ? undefined
              : (fixer) => {
                const [start, end] = range
                const lineStart = lines.starts[commentsLineNumber(lines, start)]
                const before = text.slice(lineStart, start)
                const trailingLines = commentsHorizontalSpace.test(before) ? commentsTrailingLines.exec(text.slice(end)) : null

                if (trailingLines) {
                  const removal: [number, number] = [lineStart, end + trailingLines[0].length]
                  return unicodeTerminator ? fixer.replaceTextRange(removal, unicodeTerminator) : fixer.removeRange(removal)
                }

                const afterOnLine = text.slice(end, lines.ends[commentsLineNumber(lines, end)])
                const lineBreak = commentsLineTerminator.exec(text.slice(start, end))?.[0]

                if (lineBreak && /\S/.test(before) && /\S/.test(afterOnLine)) {
                  return fixer.replaceTextRange([start, end], lineBreak)
                }

                if (unicodeTerminator) {
                  return fixer.replaceTextRange([start, end], unicodeTerminator)
                }

                if (commentsHorizontalSpace.test(afterOnLine)) {
                  return fixer.removeRange([start - (/[\t ]*$/.exec(before)?.[0].length ?? 0), end])
                }

                const left = text[start - 1]
                const right = text[end]
                const separator = left && right && !/\s/.test(left) && !/\s/.test(right) ? ' ' : ''
                return fixer.replaceTextRange([start, end], separator)
              },
          })
        }
      },
    }
  },
})
