import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceIndentSchema, sourceIndentUnit, sourceLineIndent, sourceNewline } from '../../utils/source.utils.ts'
import type { LayoutTernaryOptions } from '../../types/layout.types.ts'
import type { ESTree } from '@oxlint/plugins'

function layoutTernaryLines(node: ESTree.Node): number {
  return node.loc.end.line - node.loc.start.line + 1
}

function layoutTernaryBreak(between: string, operator: '?' | ':', newline: string): string {
  const at = between.indexOf(operator)
  return `${between.slice(0, at).trimEnd()}${newline}${operator} ${between.slice(at + 1).trimStart()}`
}

export const layoutTernary = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          max: {
            type: 'integer',
            minimum: 1,
            default: 160,
          },
          indent: { ...sourceIndentSchema, default: 2 },
          fit: {
            type: 'boolean',
            default: true,
          },
          branch: {
            type: 'object',
            additionalProperties: false,
            required: ['max'],
            properties: { max: { type: 'integer', minimum: 1 } },
          },
        },
      },
    ],
    messages: {
      long: 'This ternary branch spans {{lines}} lines (max {{max}}). Name it.',
      yield: 'A yield* ternary takes one-line operands. Name the multi-line branch.',
      join: 'Keep this conditional on one line ({{length}} columns; limit {{max}}, except in template literals).',
      split: 'This conditional does not fit on one line ({{length}} of {{max}} columns); break before `?` and `:`.',
    },
  },
  createOnce(context) {
    let maxLength = 160
    let indentUnit = sourceIndentUnit()
    let fit = true
    let branchMax: number | undefined

    const branch = (node: ESTree.ConditionalExpression, max: number) => {
      const long = [node.consequent, node.alternate].filter((operand) => layoutTernaryLines(operand) > max)

      for (const operand of long) {
        context.report({
          node: operand,
          messageId: 'long',
          data: { lines: String(layoutTernaryLines(operand)), max: String(max) },
        })
      }

      const yielded = node.parent.type === 'YieldExpression' && node.parent.delegate

      if (yielded && long.length === 0 && [node.test, node.consequent, node.alternate].some((operand) => layoutTernaryLines(operand) > 1)) {
        context.report({ node, messageId: 'yield' })
      }
    }

    return {
      before() {
        const options = optionsFirst<LayoutTernaryOptions>(context, {})
        maxLength = options.max ?? 160
        indentUnit = sourceIndentUnit(options.indent)
        fit = options.fit ?? true
        branchMax = options.branch?.max
      },
      ConditionalExpression(node) {
        const source = context.sourceCode

        if (branchMax !== undefined) {
          branch(node, branchMax)
        }

        if (!fit) {
          return
        }

        const operands = [node.test, node.consequent, node.alternate]

        if (
          node.parent.type === 'ConditionalExpression' ||
          operands.some((operand) => operand.type === 'ConditionalExpression' || operand.loc.start.line !== operand.loc.end.line) ||
          source.getCommentsInside(node).length > 0
        ) {
          return
        }

        const text = source.text
        const lineStart = text.lastIndexOf('\n', node.range[0] - 1) + 1
        const prefix = text.slice(lineStart, node.range[0])
        const newlineAt = text.indexOf('\n', node.range[1])
        const lineEnd = newlineAt === -1 ? text.length : newlineAt - (text[newlineAt - 1] === '\r' ? 1 : 0)
        const suffix = text.slice(node.range[1], lineEnd)
        const joined = text.slice(...node.range).replace(/\s*\n\s*/g, ' ')
        const length = prefix.length + joined.length + suffix.length
        const data = { length: String(length), max: String(maxLength) }
        const onOneLine = node.loc.start.line === node.loc.end.line
        const interpolated = node.parent.type === 'TemplateLiteral'

        if (!onOneLine && (interpolated || length <= maxLength)) {
          context.report({
            node,
            messageId: 'join',
            data,
            fix: (fixer) => fixer.replaceTextRange(node.range, joined),
          })
        }

        if (!onOneLine || interpolated || length <= maxLength) {
          return
        }

        const newline = `${sourceNewline(text)}${sourceLineIndent(text, node.range[0])}${indentUnit}`
        const question: [number, number] = [node.test.range[1], node.consequent.range[0]]
        const colon: [number, number] = [node.consequent.range[1], node.alternate.range[0]]
        context.report({
          node,
          messageId: 'split',
          data,
          fix: (fixer) => [
            fixer.replaceTextRange(question, layoutTernaryBreak(text.slice(...question), '?', newline)),
            fixer.replaceTextRange(colon, layoutTernaryBreak(text.slice(...colon), ':', newline)),
          ],
        })
      },
    }
  },
})
