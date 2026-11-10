import { defineRule } from '@oxlint/plugins'
import { astIsOneLine } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceIndentSchema, sourceIndentUnit, sourceItemGaps, sourceJoinedWidth, sourceLineIndent, sourceNewline } from '../../utils/source.utils.ts'
import type { LayoutJsxAttributesOptions } from '../../types/layout.types.ts'

export const layoutJsxAttributes = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          min: { type: 'integer', minimum: 1 },
          indent: sourceIndentSchema,
          join: {
            type: 'object',
            additionalProperties: false,
            required: ['max'],
            properties: { max: { type: 'integer', minimum: 1 } },
          },
        },
      },
    ],
    messages: {
      multiline: 'Put every JSX attribute and the closing token on its own line.',
      join: 'This tag fits on one line, so keep it on one line.',
    },
  },
  createOnce(context) {
    let minAttributes = 3
    let indentUnit = sourceIndentUnit()
    let newline = '\n'
    let joinMax: number | undefined

    return {
      before() {
        const options = optionsFirst<LayoutJsxAttributesOptions>(context, {})
        minAttributes = options.min ?? 3
        indentUnit = sourceIndentUnit(options.indent)
        newline = sourceNewline(context.sourceCode.text)
        joinMax = options.join?.max
      },
      JSXOpeningElement(node) {
        const source = context.sourceCode
        const text = source.text
        const attributes = node.attributes
        const split = attributes.length >= minAttributes

        if (split ? !astIsOneLine(node) : joinMax === undefined || astIsOneLine(node)) {
          return
        }

        if (!split) {
          const start = (node.typeArguments ?? node.name).range[1]

          if (attributes.length === 0 || !attributes.every(astIsOneLine) || text.slice(node.range[0], start).includes('\n') || source.getCommentsInside(node).length > 0) {
            return
          }

          const end = node.range[1] - (node.selfClosing ? 2 : 1)
          const ranges = sourceItemGaps(start, attributes, end)
          const closing = node.selfClosing ? ' ' : ''

          if (sourceJoinedWidth(text, start, ` ${attributes.map((attribute) => source.getText(attribute)).join(' ')}${closing}`, end) > (joinMax ?? 0)) {
            return
          }

          context.report({
            node,
            messageId: 'join',
            fix: (fixer) =>
              ranges.some((range) => !/^\s*$/.test(text.slice(...range)))
                ? null
                : ranges.map((range, index) => fixer.replaceTextRange(range, index === ranges.length - 1 ? closing : ' ')),
          })

          return
        }

        const baseIndent = sourceLineIndent(text, node.range[0])
        const attributeIndent = baseIndent + indentUnit

        context.report({
          node,
          messageId: 'multiline',
          fix: (fixer) => {
            if (source.getCommentsInside(node).length > 0) {
              return null
            }

            const ranges = sourceItemGaps((node.typeArguments ?? node.name).range[1], attributes, node.range[1] - (node.selfClosing ? 2 : 1))

            if (ranges.some((range) => !/^\s*$/.test(text.slice(...range)))) {
              return null
            }

            return ranges.map((range, index) => fixer.replaceTextRange(range, `${newline}${index === ranges.length - 1 ? baseIndent : attributeIndent}`))
          },
        })
      },
    }
  },
})
