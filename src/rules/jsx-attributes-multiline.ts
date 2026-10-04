import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { layoutIndentSchema, layoutIndentUnit, layoutLineIndent, layoutNewline, optionsFirst } from '../utils/index.ts'
import type { LayoutIndent } from '../utils/index.ts'

interface JsxAttributesMultilineOptions {
  minAttributes?: number
  indent?: LayoutIndent
}

interface JsxAttributesMultilineEdit {
  range: [number, number]
  text: string
}

function jsxAttributesMultilineEdits(
  node: ESTree.JSXOpeningElement,
  text: string,
  attributeIndent: string,
  baseIndent: string,
  newline: string,
): JsxAttributesMultilineEdit[] | null {
  const first = node.attributes[0]
  const last = node.attributes.at(-1)
  if (!first || !last) return null

  const prefix = node.typeArguments ?? node.name
  const openingRange: [number, number] = [prefix.range[1], first.range[0]]
  if (!/^\s*$/.test(text.slice(...openingRange))) return null

  const edits: JsxAttributesMultilineEdit[] = [
    {
      range: openingRange,
      text: `${newline}${attributeIndent}`,
    },
  ]

  for (let index = 1; index < node.attributes.length; index++) {
    const previous = node.attributes[index - 1]
    const current = node.attributes[index]
    const range: [number, number] = [previous.range[1], current.range[0]]
    if (!/^\s*$/.test(text.slice(...range))) return null
    edits.push({ range, text: `${newline}${attributeIndent}` })
  }

  const closing = node.range[1] - (node.selfClosing ? 2 : 1)
  const closingRange: [number, number] = [last.range[1], closing]
  if (!/^\s*$/.test(text.slice(...closingRange))) return null
  edits.push({ range: closingRange, text: `${newline}${baseIndent}` })

  return edits
}

/**
 * Splits large single-line JSX opening tags onto one attribute per line with a separate closing token.
 *
 * Example: `<Panel a={1} b={2} c={3} />` becomes a vertically aligned opening tag.
 */
export const jsxAttributesMultiline = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          minAttributes: { type: 'integer', minimum: 1 },
          indent: layoutIndentSchema,
        },
      },
    ],
    messages: {
      multiline: 'Put every JSX attribute and the closing token on its own line.',
    },
  },
  createOnce(context) {
    let minAttributes = 3
    let indentUnit = layoutIndentUnit()
    let newline = '\n'

    return {
      before() {
        const options = optionsFirst<JsxAttributesMultilineOptions>(context, {})
        minAttributes = options.minAttributes ?? 3
        indentUnit = layoutIndentUnit(options.indent)
        newline = layoutNewline(context.sourceCode.text)
      },
      JSXOpeningElement(node) {
        if (node.attributes.length < minAttributes || node.loc.start.line !== node.loc.end.line) return

        const source = context.sourceCode
        const text = source.text
        const baseIndent = layoutLineIndent(text, node.range[0])
        const hasComments = source.getCommentsInside(node).length > 0
        const edits = hasComments
          ? null
          : jsxAttributesMultilineEdits(node, text, baseIndent + indentUnit, baseIndent, newline)

        context.report({
          node,
          messageId: 'multiline',
          fix: edits ? (fixer) => edits.map((edit) => fixer.replaceTextRange(edit.range, edit.text)) : undefined,
        })
      },
    }
  },
})
