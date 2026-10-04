import { defineRule } from '@oxlint/plugins'
import type { Context, ESTree, Scope, SourceCode } from '@oxlint/plugins'
import { layoutIndentSchema, layoutIndentUnit, layoutLineIndent, layoutNewline, optionsFirst } from '../utils/index.ts'
import type { LayoutIndent } from '../utils/index.ts'

interface CallArrayMultilineOptions {
  callees?: string[]
  minElements?: number
  indent?: LayoutIndent
}

interface CallArrayMultilineEdit {
  range: [number, number]
  text: string
}

function callArrayMultilineCallee(node: ESTree.Expression): { name: string; root: ESTree.Expression } | null {
  if (node.type === 'Identifier') return { name: node.name, root: node }
  if (node.type !== 'MemberExpression' || node.computed || node.property.type !== 'Identifier') return null

  const object = callArrayMultilineCallee(node.object)
  return object ? { name: `${object.name}.${node.property.name}`, root: object.root } : null
}

function callArrayMultilineIsShadowed(context: Context, root: ESTree.Expression): boolean {
  if (root.type !== 'Identifier') return false

  let scope: Scope | null = context.sourceCode.getScope(root)
  while (scope) {
    const variable = scope.set.get(root.name)
    if (variable) return variable.defs.length > 0
    scope = scope.upper
  }

  return false
}

// Why: ESTree drops parentheses; an element's neighbours are only `[` `,` `]` or wrapping parens.
function callArrayMultilineOuterRange(source: SourceCode, node: ESTree.Node): [number, number] {
  let range: [number, number] = [node.range[0], node.range[1]]
  let before = source.getTokenBefore(node)
  let after = source.getTokenAfter(node)

  while (before?.value === '(' && after?.value === ')') {
    range = [before.range[0], after.range[1]]
    before = source.getTokenBefore(before)
    after = source.getTokenAfter(after)
  }

  return range
}

function callArrayMultilineEdits(
  array: ESTree.ArrayExpression,
  source: SourceCode,
  text: string,
  elementIndent: string,
  baseIndent: string,
  newline: string,
): CallArrayMultilineEdit[] | null {
  const elements = array.elements
  if (elements.some((element) => element === null)) return null

  const present = elements
    .filter((element): element is Exclude<typeof element, null> => element !== null)
    .map((element) => callArrayMultilineOuterRange(source, element))
  const first = present[0]
  const last = present.at(-1)
  if (!first || !last) return null

  const edits: CallArrayMultilineEdit[] = []
  const openingRange: [number, number] = [array.range[0] + 1, first[0]]
  if (!/^\s*$/.test(text.slice(...openingRange))) return null
  edits.push({ range: openingRange, text: `${newline}${elementIndent}` })

  for (let index = 1; index < present.length; index++) {
    const previous = present[index - 1]
    const current = present[index]
    const gap = text.slice(previous[1], current[0])
    if (!/^,\s*$/.test(gap)) return null
    edits.push({
      range: [previous[1] + 1, current[0]],
      text: `${newline}${elementIndent}`,
    })
  }

  const closingRange: [number, number] = [last[1], array.range[1] - 1]
  const closingGap = text.slice(...closingRange)
  if (!/^,?\s*$/.test(closingGap)) return null
  edits.push({
    range: [closingRange[0] + (closingGap.startsWith(',') ? 1 : 0), closingRange[1]],
    text: `${newline}${baseIndent}`,
  })

  return edits
}

/**
 * Splits large single-line array arguments for configured calls onto one element per line.
 *
 * Example: `queue.run([first, second])` becomes a multiline array argument.
 */
export const callArrayMultiline = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          callees: { type: 'array', items: { type: 'string' } },
          minElements: { type: 'integer', minimum: 1 },
          indent: layoutIndentSchema,
        },
      },
    ],
    messages: {
      multiline: 'Put every array element in this call on its own line.',
    },
  },
  createOnce(context) {
    let callees = new Set(['Promise.all', 'Promise.allSettled'])
    let minElements = 2
    let indentUnit = layoutIndentUnit()
    let newline = '\n'

    return {
      before() {
        const options = optionsFirst<CallArrayMultilineOptions>(context, {})
        callees = new Set(options.callees ?? ['Promise.all', 'Promise.allSettled'])
        minElements = options.minElements ?? 2
        indentUnit = layoutIndentUnit(options.indent)
        newline = layoutNewline(context.sourceCode.text)
        if (callees.size === 0) return false
      },
      CallExpression(node) {
        const callee = callArrayMultilineCallee(node.callee)
        if (!callee || !callees.has(callee.name)) return

        // Why: most matching calls do not contain a qualifying array, so avoid scope work first.
        const array = node.arguments[0]
        if (array?.type !== 'ArrayExpression' || array.elements.length < minElements) return
        if (array.loc.start.line !== array.loc.end.line) return

        // Why: only Promise names a built-in whose local shadow changes the configured call's meaning.
        if (
          callee.root.type === 'Identifier' &&
          callee.root.name === 'Promise' &&
          callArrayMultilineIsShadowed(context, callee.root)
        )
          return

        const source = context.sourceCode
        const text = source.text
        const baseIndent = layoutLineIndent(text, array.range[0])
        const hasComments = source.getCommentsInside(array).length > 0
        const edits = hasComments
          ? null
          : callArrayMultilineEdits(array, source, text, baseIndent + indentUnit, baseIndent, newline)

        context.report({
          node: array,
          messageId: 'multiline',
          fix: edits ? (fixer) => edits.map((edit) => fixer.replaceTextRange(edit.range, edit.text)) : undefined,
        })
      },
    }
  },
})
