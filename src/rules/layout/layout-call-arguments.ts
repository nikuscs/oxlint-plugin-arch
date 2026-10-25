import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceLineIndent, sourceNewline } from '../../utils/source.utils.ts'
import type { LayoutCallArgumentsOptions } from '../../types/layout.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const layoutCallArguments = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          min: {
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
      const last = args.at(-1)
      const source = context.sourceCode

      if (
        args.length < minArguments ||
        !last ||
        args.some((arg) => (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') && arg.loc.start.line !== arg.loc.end.line) ||
        source.getCommentsInside(node).length > 0
      ) {
        return
      }

      const text = source.text
      const open = text.indexOf('(', (node.typeArguments ?? node.callee).range[1])
      const close = node.range[1] - 1

      const gaps: [number, number][] = [
        [open + 1, args[0].range[0]],
        ...args.slice(1).map((arg, index): [number, number] => [args[index].range[1], arg.range[0]]),
        [last.range[1], close],
      ]

      const between = gaps.map((gap) => text.slice(...gap))

      if (
        text[open] !== '(' ||
        text[close] !== ')' ||
        !/^\s*$/.test(between[0]) ||
        between.slice(1, -1).some((gap) => !/^\s*,\s*$/.test(gap)) ||
        !/^\s*,?\s*$/.test(between.at(-1) ?? '') ||
        between.every((gap) => gap.includes('\n'))
      ) {
        return
      }

      const baseIndent = sourceLineIndent(text, open)
      const newline = sourceNewline(text)
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

            const comma = between[index].includes(',') ? ',' : ''
            return fixer.replaceTextRange(gap, `${comma}${newline}${index === gaps.length - 1 ? baseIndent : argumentIndent}`)
          }),
      })
    }

    return {
      before() {
        const options = optionsFirst<LayoutCallArgumentsOptions>(context, {})
        minArguments = options.min ?? 3
        indent = options.indent ?? 2
      },
      CallExpression: check,
      NewExpression: check,
    }
  },
})
