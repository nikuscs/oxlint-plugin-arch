import { defineRule } from '@oxlint/plugins'
import { astCallDepth, astIsCall, astIsInlineFunction, astIsOneLine, astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceIndentSchema, sourceIndentUnit, sourceItemGaps, sourceJoinedWidth, sourceLineEnd, sourceLineIndent, sourceLineStart, sourceNewline, sourceRespace } from '../../utils/source.utils.ts'
import type { AstCall } from '../../types/ast.types.ts'
import type { LayoutCallArgumentsOptions } from '../../types/layout.types.ts'
import type { ESTree, Token } from '@oxlint/plugins'

function layoutCallArgumentsHuggable(node: ESTree.Node): boolean {
  return (
    astIsInlineFunction(node) ||
    node.type === 'ObjectExpression' ||
    node.type === 'ArrayExpression' ||
    (astIsCall(node) &&
      node.arguments.length === 1 &&
      (node.callee.type !== 'MemberExpression' || astIsOneLine(node.callee)) &&
      node.arguments.every(layoutCallArgumentsHuggable))
  )
}

const layoutCallArgumentsMax = { type: 'integer', minimum: 1 }

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
          indent: { ...sourceIndentSchema, default: 2 },
          split: {
            type: 'boolean',
            default: true,
          },
          pipe: {
            type: 'object',
            additionalProperties: false,
            required: ['min'],
            properties: { min: { type: 'integer', minimum: 2 }, methods: { type: 'array', items: { type: 'string' } } },
          },
          hug: {
            type: 'object',
            additionalProperties: false,
            required: ['max'],
            properties: { max: layoutCallArgumentsMax },
          },
          join: {
            type: 'object',
            additionalProperties: false,
            required: ['max'],
            properties: {
              max: layoutCallArgumentsMax,
              nesting: layoutCallArgumentsMax,
              items: layoutCallArgumentsMax,
              keep: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    ],
    messages: {
      multiline: 'A call with {{min}}+ arguments puts each argument on its own line.',
      pipe: 'A pipe with {{min}}+ steps puts each step on its own line.',
      hug: 'Put every argument on its own line. Only a last callback, object or array may hug the call, after simple arguments.',
      prefer: 'Hug the last argument: it is a callback, object or array after simple arguments.',
      join: 'This fits on one line, so keep it on one line.',
    },
  },
  createOnce(context) {
    let options: LayoutCallArgumentsOptions = {}
    let minArguments = 3
    let indentUnit = sourceIndentUnit()
    let pipeMethods = new Set<string>()

    const isPipe = (node: AstCall) => node.callee.type === 'MemberExpression' && pipeMethods.has(astMemberName(node.callee) ?? '')

    const split = (node: AstCall, min: number, messageId: 'multiline' | 'pipe') => {
      const args = node.arguments
      const last = args.at(-1)
      const source = context.sourceCode

      if (
        args.length < min ||
        !last ||
        args.some((arg) => (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') && arg.loc.start.line !== arg.loc.end.line)
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

      if (between.every((gap) => gap.includes('\n'))) {
        return
      }

      const unsafe =
        source.getCommentsInside(node).length > 0 ||
        text[open] !== '(' ||
        text[close] !== ')' ||
        !/^\s*$/.test(between[0]) ||
        between.slice(1, -1).some((gap) => !/^\s*,\s*$/.test(gap)) ||
        !/^\s*,?\s*$/.test(between.at(-1) ?? '')

      const baseIndent = sourceLineIndent(text, open)
      const newline = sourceNewline(text)
      const argumentIndent = `${baseIndent}${indentUnit}`
      context.report({
        node,
        messageId,
        data: { min: String(min) },
        fix: unsafe ? undefined : (fixer) =>
          gaps.map((gap, index) => {
            if (index === 0) {
              return fixer.replaceTextRange(gap, `${newline}${argumentIndent}`)
            }

            const comma = between[index].includes(',') ? ',' : ''
            return fixer.replaceTextRange(gap, `${comma}${newline}${index === gaps.length - 1 ? baseIndent : argumentIndent}`)
          }),
      })
    }

    const hug = (node: AstCall, max: number) => {
      const source = context.sourceCode
      const text = source.text
      const args = node.arguments
      const first = args.at(0)
      const last = args.at(-1)
      const open = source.getTokenAfter(node.typeArguments ?? node.callee)
      const close = source.getLastToken(node)

      if (!first || !last || !open || !close || source.getCommentsInside(node).length > 0) {
        return
      }

      if (args.every(astIsOneLine)) {
        if (first.loc.start.line > open.loc.end.line && close.loc.start.line === last.loc.end.line) {
          const newline = sourceNewline(text)
          const base = sourceLineIndent(text, open.range[0])

          context.report({
            node,
            messageId: 'hug',
            fix: (fixer) => sourceRespace(fixer, text, sourceItemGaps(open.range[1], args, close.range[0]), (_, end) => `${newline}${end ? base : `${base}${indentUnit}`}`),
          })
        }

        return
      }

      const leading = args.slice(0, -1)
      const canHug = !isPipe(node) && leading.every((arg) => astIsOneLine(arg) && astCallDepth(arg) <= 1) && layoutCallArgumentsHuggable(last)
      const gaps = sourceItemGaps(open.range[1], args, close.range[0])

      if (first.loc.start.line > open.loc.end.line) {
        const head = [...leading.map((arg) => source.getText(arg)), text.slice(last.range[0], sourceLineEnd(text, last.range[0]))]
        const hugged = `${text.slice(sourceLineStart(text, open.range[0]), open.range[1])}${head.join(', ')}`

        if (canHug && args.length <= 2 && hugged.length <= max) {
          context.report({
            node,
            messageId: 'prefer',
            fix: (fixer) => sourceRespace(fixer, text, gaps, (index, end) => (index === 0 || end ? '' : ' ')),
          })
        }

        return
      }

      if (astIsOneLine(node) || canHug) {
        return
      }

      const newline = sourceNewline(text)
      const base = sourceLineIndent(text, open.range[0])
      const inner = `${base}${indentUnit}`

      context.report({
        node,
        messageId: 'hug',
        fix: (fixer) => sourceRespace(fixer, text, gaps, (_, end) => `${newline}${end ? base : inner}`),
      })
    }

    const join = (node: ESTree.Node, items: readonly ESTree.Node[], open: Token | null, close: Token | null) => {
      const source = context.sourceCode
      const text = source.text
      const first = items.at(0)

      if (
        !first ||
        !open ||
        !close ||
        items.length > Math.min(options.join?.items ?? 2, options.split === false ? Number.POSITIVE_INFINITY : minArguments - 1) ||
        first.loc.start.line === open.loc.end.line ||
        !items.every(astIsOneLine) ||
        source.commentsExistBetween(open, close)
      ) {
        return
      }

      const gaps = sourceItemGaps(open.range[1], items, close.range[0])
      const comma = text.slice(...(gaps.at(-1) ?? [0, 0])).includes(',') ? ',' : ''

      if (sourceJoinedWidth(text, open.range[1], `${items.map((item) => source.getText(item)).join(', ')}${comma}`, close.range[0]) > (options.join?.max ?? 0)) {
        return
      }

      context.report({
        node,
        messageId: 'join',
        fix: (fixer) => sourceRespace(fixer, text, gaps, (index, end) => (index === 0 || end ? '' : ' ')),
      })
    }

    const call = (node: AstCall) => {
      const source = context.sourceCode

      if (options.pipe && isPipe(node)) {
        split(node, options.pipe.min, 'pipe')
      } else if (options.split !== false) {
        split(node, minArguments, 'multiline')
      }

      if (options.hug) {
        hug(node, options.hug.max)
      }

      if (
        options.join &&
        !(options.join.keep ?? []).includes(source.getText(node.callee)) &&
        !(isPipe(node) && (node.arguments.length > 1 || options.pipe)) &&
        astCallDepth(node) <= (options.join.nesting ?? Number.POSITIVE_INFINITY)
      ) {
        join(node, node.arguments, source.getTokenAfter(node.typeArguments ?? node.callee), source.getLastToken(node))
      }
    }

    const parameters = (node: ESTree.Node & { readonly params: readonly ESTree.Node[] }) => {
      const source = context.sourceCode
      const first = node.params.at(0)
      const last = node.params.at(-1)

      if (!options.join || !first || !last) {
        return
      }

      join(
        node,
        node.params,
        source.getTokenBefore(first, { filter: (token) => token.value === '(' }),
        source.getTokenAfter(last, { filter: (token) => token.value === ')' }),
      )
    }

    return {
      before() {
        options = optionsFirst<LayoutCallArgumentsOptions>(context, {})
        minArguments = options.min ?? 3
        indentUnit = sourceIndentUnit(options.indent)
        pipeMethods = new Set(options.pipe?.methods ?? ['pipe'])
      },
      CallExpression: call,
      NewExpression: call,
      FunctionExpression: parameters,
      FunctionDeclaration: parameters,
      ArrowFunctionExpression: parameters,
      TSFunctionType: parameters,
      TSMethodSignature: parameters,
    }
  },
})
