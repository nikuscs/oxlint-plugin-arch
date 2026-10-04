import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import {
  astVisit,
  commentsIsDirective,
  commentsIsDisableNextLine,
  commentsIsJsdoc,
  commentsIsWhy,
  commentsNormalizedValue,
  optionsFirst,
} from '../utils/index.ts'

interface NoCommentsOptions {
  allowWhy?: boolean
  allowPatterns?: string[]
  allowJsdoc?: boolean
}

const NO_COMMENTS_LINE_GAP = /^[\t \r\n\u2028\u2029]*$/
const NO_COMMENTS_LINE_TERMINATOR = /\r\n|[\n\r\u2028\u2029]/
const NO_COMMENTS_TRAILING_LINES = /^[\t ]*(?:\r\n|[\n\r\u2028\u2029])(?:[\t ]*(?:\r\n|[\n\r\u2028\u2029]))*/
const NO_COMMENTS_HORIZONTAL_SPACE = /^[\t ]*$/

interface NoCommentsLineIndex {
  starts: number[]
  ends: number[]
}

function noCommentsCreateLineIndex(text: string): NoCommentsLineIndex {
  const starts = [0]
  const ends: number[] = []

  for (let index = 0; index < text.length; index++) {
    const character = text[index]
    if (character === '\r') {
      ends.push(index)
      if (text[index + 1] === '\n') index++
      starts.push(index + 1)
    } else if (character === '\n' || character === '\u2028' || character === '\u2029') {
      ends.push(index)
      starts.push(index + 1)
    }
  }
  ends.push(text.length)

  return { starts, ends }
}

function noCommentsLineNumber(lines: NoCommentsLineIndex, offset: number): number {
  let low = 0
  let high = lines.starts.length

  while (low < high) {
    const middle = (low + high) >>> 1
    if (lines.starts[middle] <= offset) low = middle + 1
    else high = middle
  }

  return low - 1
}

function noCommentsLineStart(lines: NoCommentsLineIndex, offset: number): number {
  return lines.starts[noCommentsLineNumber(lines, offset)]
}

function noCommentsLineEnd(lines: NoCommentsLineIndex, offset: number): number {
  return lines.ends[noCommentsLineNumber(lines, offset)]
}

function noCommentsIncludesLine(lines: number[], start: number, end: number): boolean {
  let low = 0
  let high = lines.length

  while (low < high) {
    const middle = (low + high) >>> 1
    if (lines[middle] < start) low = middle + 1
    else high = middle
  }

  return lines[low] <= end
}

function noCommentsFollowsOpeningBrace(text: string, offset: number): boolean {
  for (let index = offset - 1; index >= 0; index--) {
    const character = text[index]
    if (!/\s/.test(character)) return character === '{'
  }
  return false
}

function noCommentsGroups(comments: ESTree.Comment[], text: string): ESTree.Comment[][] {
  const groups: ESTree.Comment[][] = []

  for (const comment of comments) {
    const current = groups.at(-1)
    const previous = current?.at(-1)
    if (current && previous) {
      const between = text.slice(previous.range[1], comment.range[0])
      if (NO_COMMENTS_LINE_GAP.test(between)) {
        current.push(comment)
        continue
      }
    }

    groups.push([comment])
  }

  return groups
}

function noCommentsJsxEmptyContainer(
  containers: ESTree.JSXExpressionContainer[],
  start: number,
  end: number,
): ESTree.JSXExpressionContainer | undefined {
  let low = 0
  let high = containers.length

  while (low < high) {
    const middle = (low + high) >>> 1
    if (containers[middle].range[0] <= start) low = middle + 1
    else high = middle
  }

  const container = containers[low - 1]
  return container?.range[1] >= end ? container : undefined
}

/**
 * Reports comments in a file, keeping directives and optional `Why:` notes, JSDoc, or allowed patterns.
 *
 * Example: `// Why: cache keys must stay stable.` passes; `// leftover thought` is removed.
 */
export const noComments = defineRule({
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
        const options = optionsFirst<NoCommentsOptions>(context, {})
        allowWhy = options.allowWhy ?? true
        allowJsdoc = options.allowJsdoc ?? false
        allowed = (options.allowPatterns ?? []).map((pattern) => new RegExp(pattern))
      },
      Program(program) {
        const source = context.sourceCode
        const text = source.text
        const comments = source.getAllComments().filter((comment) => comment.type !== 'Shebang')
        const removable: ESTree.Comment[] = []
        const protectedTargetLines: number[] = []
        let mightContainJsxComment = false
        let whyContinuation = false
        let previousComment: ESTree.Comment | undefined

        for (const comment of comments) {
          const value = commentsNormalizedValue(comment)
          if (
            !mightContainJsxComment &&
            comment.type === 'Block' &&
            noCommentsFollowsOpeningBrace(text, comment.range[0])
          ) {
            mightContainJsxComment = true
          }
          const directlyFollowsPrevious =
            previousComment !== undefined &&
            comment.loc.start.line === previousComment.loc.end.line + 1 &&
            NO_COMMENTS_LINE_GAP.test(text.slice(previousComment.range[1], comment.range[0]))
          const continuesWhy: boolean = comment.type === 'Line' && whyContinuation && directlyFollowsPrevious
          const isWhy: boolean = commentsIsWhy(value) || continuesWhy
          if (commentsIsDisableNextLine(value)) {
            protectedTargetLines.push(comment.loc.end.line + 1)
          }
          whyContinuation = comment.type === 'Line' && isWhy
          previousComment = comment

          if (allowWhy && isWhy) continue
          if (commentsIsDirective(value)) continue
          if (allowJsdoc && commentsIsJsdoc(text, comment)) continue
          if (allowed.some((pattern) => pattern.test(value.trim()))) continue

          removable.push(comment)
        }

        if (removable.length === 0) return
        const lines = noCommentsCreateLineIndex(text)
        const jsxContainers: ESTree.JSXExpressionContainer[] = []
        if (mightContainJsxComment) {
          astVisit(program, [], (node) => {
            if (node.type === 'JSXExpressionContainer' && node.expression.type === 'JSXEmptyExpression') {
              jsxContainers.push(node)
            }
          })
          jsxContainers.sort((left, right) => left.range[0] - right.range[0])
        }

        // Why: oxlint applies one fix per overlapping range per pass, so a run of
        // stacked comments must be deleted by a single fix or `--fix` silently
        // leaves the tail behind and never converges.
        for (const group of noCommentsGroups(removable, text)) {
          const first = group[0]
          const final = group[group.length - 1]
          const container = noCommentsJsxEmptyContainer(jsxContainers, first.range[0], final.range[1])
          let embeddedUnicodeLineTerminator: string | undefined
          for (const comment of group) {
            if (comment.type === 'Block' && embeddedUnicodeLineTerminator === undefined) {
              embeddedUnicodeLineTerminator = text
                .slice(comment.range[0], comment.range[1])
                .match(/[\u2028\u2029]/)?.[0]
            }
          }
          const reportOnly =
            container !== undefined ||
            noCommentsIncludesLine(protectedTargetLines, first.loc.start.line, final.loc.end.line)
          const range0 = first.range[0]
          const range1 = final.range[1]

          context.report({
            loc: { start: first.loc.start, end: final.loc.end },
            messageId: 'comment',
            ...(reportOnly
              ? {}
              : {
                  fix(fixer) {
                    const lineStart = noCommentsLineStart(lines, range0)
                    const before = text.slice(lineStart, range0)
                    if (NO_COMMENTS_HORIZONTAL_SPACE.test(before)) {
                      const trailingLines = text.slice(range1).match(NO_COMMENTS_TRAILING_LINES)
                      if (trailingLines) {
                        const end = range1 + trailingLines[0].length
                        return embeddedUnicodeLineTerminator
                          ? fixer.replaceTextRange([lineStart, end], embeddedUnicodeLineTerminator)
                          : fixer.removeRange([lineStart, end])
                      }
                    }

                    const removed = text.slice(range0, range1)
                    const lineBreak = removed.match(NO_COMMENTS_LINE_TERMINATOR)?.[0]
                    let afterOnLine: string | undefined
                    if (lineBreak) {
                      afterOnLine = text.slice(range1, noCommentsLineEnd(lines, range1))
                      if (/\S/.test(before) && /\S/.test(afterOnLine)) {
                        return fixer.replaceTextRange([range0, range1], lineBreak)
                      }
                    }
                    if (embeddedUnicodeLineTerminator) {
                      return fixer.replaceTextRange([range0, range1], embeddedUnicodeLineTerminator)
                    }

                    // Why: trailing comments own their preceding horizontal spacing, but
                    // inline comments may be the only boundary between two tokens.
                    afterOnLine ??= text.slice(range1, noCommentsLineEnd(lines, range1))
                    if (NO_COMMENTS_HORIZONTAL_SPACE.test(afterOnLine)) {
                      const start = range0 - (/[\t ]*$/.exec(before)?.[0].length ?? 0)
                      return fixer.removeRange([start, range1])
                    }

                    const left = text[range0 - 1]
                    const right = text[range1]
                    const separator = left && right && !/\s/.test(left) && !/\s/.test(right) ? ' ' : ''
                    return fixer.replaceTextRange([range0, range1], separator)
                  },
                }),
          })
        }
      },
    }
  },
})
