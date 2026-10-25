import { defineRule } from '@oxlint/plugins'
import { layoutLineIndent, layoutNewline, optionsFirst } from '../../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface TernaryLayoutOptions {
  maxLength?: number
  indent?: number
}

function ternaryLayoutLineStart(text: string, offset: number): number {
  return text.lastIndexOf('\n', offset - 1) + 1
}

function ternaryLayoutLineEnd(text: string, offset: number): number {
  const end = text.indexOf('\n', offset)

  if (end === -1) {
    return text.length
  }
  return text[end - 1] === '\r' ? end - 1 : end
}

// The gap between two operands with the operator moved onto its own line: `a ? b` -> `a\n  ? b`.
function ternaryLayoutBreak(between: string, operator: '?' | ':', newline: string): string {
  const at = between.indexOf(operator)

  return `${between.slice(0, at).trimEnd()}${newline}${operator} ${between.slice(at + 1).trimStart()}`
}

/**
 * A conditional expression sits on one line when that line fits `maxLength`, and breaks before
 * `?` and `:` when it does not. Both directions are auto-fixed.
 * Example: `const value = ready ? yes : no` stays joined when the full line fits.
 *
 * A conditional interpolated in a template literal always stays on one line. Skipped: a nested
 * conditional (no-nested-ternary owns it), one with comments inside, and one whose test or branch
 * spans several lines itself (an object or a function).
 */
export const layoutTernary = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          maxLength: {
            type: 'integer',
            minimum: 1,
            default: 160,
          },
          indent: {
            type: 'integer',
            minimum: 1,
            default: 2,
          },
        },
      },
    ],
    messages: {
      join: 'Keep this conditional on one line ({{length}} columns; limit {{max}}, except in template literals).',
      split: 'This conditional does not fit on one line ({{length}} of {{max}} columns); break before `?` and `:`.',
    },
  },
  createOnce(context) {
    let maxLength = 160
    let indent = 2

    return {
      before() {
        const options = optionsFirst<TernaryLayoutOptions>(context, {})
        maxLength = options.maxLength ?? 160
        indent = options.indent ?? 2
      },
      ConditionalExpression(node: ESTree.ConditionalExpression) {
        const source = context.sourceCode
        const text = source.text
        const operands = [node.test, node.consequent, node.alternate]

        if (
          node.parent.type === 'ConditionalExpression'
          || operands.some((operand) => operand.type === 'ConditionalExpression' || operand.loc.start.line !== operand.loc.end.line)
          || source.getCommentsInside(node).length > 0
        ) {
          return
        }

        const prefix = text.slice(ternaryLayoutLineStart(text, node.range[0]), node.range[0])
        const suffix = text.slice(node.range[1], ternaryLayoutLineEnd(text, node.range[1]))
        const joined = text.slice(node.range[0], node.range[1]).replace(/\s*\n\s*/g, ' ')
        const length = prefix.length + joined.length + suffix.length
        const onOneLine = node.loc.start.line === node.loc.end.line
        // An interpolated conditional reads as part of its string, so it stays on one line at any length.
        const interpolated = node.parent.type === 'TemplateLiteral'

        if (!onOneLine && (interpolated || length <= maxLength)) {
          context.report({
            node,
            messageId: 'join',
            data: { length: String(length), max: String(maxLength) },
            fix: (fixer) => fixer.replaceTextRange(node.range, joined),
          })
        }

        if (onOneLine && !interpolated && length > maxLength) {
          const newline = `${layoutNewline(text)}${layoutLineIndent(text, node.range[0])}${' '.repeat(indent)}`
          const question: [number, number] = [node.test.range[1], node.consequent.range[0]]
          const colon: [number, number] = [node.consequent.range[1], node.alternate.range[0]]

          context.report({
            node,
            messageId: 'split',
            data: { length: String(length), max: String(maxLength) },
            fix: (fixer) => [
              fixer.replaceTextRange(question, ternaryLayoutBreak(
                text.slice(...question),
                '?',
                newline,
              )),
              fixer.replaceTextRange(colon, ternaryLayoutBreak(
                text.slice(...colon),
                ':',
                newline,
              )),
            ],
          })
        }
      },
    }
  },
})
