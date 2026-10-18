import { defineRule } from '@oxlint/plugins'
import { layoutLineIndent, layoutNewline, optionsFirst } from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface CallArgumentsMultilineOptions {
  minArguments?: number
  indent?: number
}

function callArgumentsIsCallback(node: ESTree.Node): boolean {
  return (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') && node.loc.start.line !== node.loc.end.line
}

/**
 * A call or `new` with `minArguments` or more arguments puts each argument on its own line, the
 * closing parenthesis on its own line, and a trailing comma, including after spread arguments.
 * Example: `save(a, b, c)` becomes one argument per line.
 *
 * Skipped: a call with comments inside, a parenthesized argument, and a call that passes a
 * multi-line callback (it keeps the callback hugged, as in `describe('…', () => { … })`).
 */
export const callArgumentsMultiline = defineRule({
  meta: {
    type: 'layout',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          minArguments: {
            type: 'integer',
            minimum: 2,
            default: 3,
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
      multiline: 'A call with {{min}}+ arguments puts each argument on its own line.',
    },
  },
  createOnce(context) {
    let minArguments = 3
    let indent = 2

    const check = (node: ESTree.CallExpression | ESTree.NewExpression) => {
      const args = node.arguments

      if (args.length < minArguments || args.some(callArgumentsIsCallback) || context.sourceCode.getCommentsInside(node).length > 0) {
        return
      }

      const text = context.sourceCode.text
      const open = text.indexOf('(', (node.typeArguments ?? node.callee).range[1])
      const close = node.range[1] - 1
      const first = args[0]
      const last = args[args.length - 1]

      const gaps: [number, number][] = [[open + 1, first.range[0]]]

      for (let index = 1; index < args.length; index++) {
        gaps.push([args[index - 1].range[1], args[index].range[0]])
      }

      gaps.push([last.range[1], close])

      const between = gaps.map(([start, end]) => text.slice(start, end))

      if (
        text[open] !== '('
        || text[close] !== ')'
        || !/^\s*$/.test(between[0])
        || between.slice(1, -1).some((gap) => !/^\s*,\s*$/.test(gap))
        || !/^\s*,?\s*$/.test(between[between.length - 1])
      ) {
        return
      }

      if (between.every((gap) => gap.includes('\n'))) {
        return
      }

      const baseIndent = layoutLineIndent(text, open)
      const newline = layoutNewline(text)
      const argumentIndent = `${baseIndent}${' '.repeat(indent)}`

      context.report({
        node,
        messageId: 'multiline',
        data: { min: String(minArguments) },
        fix: (fixer) =>
          gaps.map((gap, index) => {
            if (index === 0) {
              return fixer.replaceTextRange(gap, `${newline}${argumentIndent}`)
            }

            return fixer.replaceTextRange(gap, index === gaps.length - 1 ? `,${newline}${baseIndent}` : `,${newline}${argumentIndent}`)
          }),
      })
    }

    return {
      before() {
        const options = optionsFirst<CallArgumentsMultilineOptions>(context, {})
        minArguments = options.minArguments ?? 3
        indent = options.indent ?? 2
      },
      CallExpression: check,
      NewExpression: check,
    }
  },
})
