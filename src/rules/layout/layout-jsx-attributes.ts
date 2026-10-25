import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceIndentSchema, sourceIndentUnit, sourceLineIndent, sourceNewline } from '../../utils/source.utils.ts'
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
          minAttributes: { type: 'integer', minimum: 1 },
          indent: sourceIndentSchema,
        },
      },
    ],
    messages: {
      multiline: 'Put every JSX attribute and the closing token on its own line.',
    },
  },
  createOnce(context) {
    let minAttributes = 3
    let indentUnit = sourceIndentUnit()
    let newline = '\n'

    return {
      before() {
        const options = optionsFirst<LayoutJsxAttributesOptions>(context, {})
        minAttributes = options.minAttributes ?? 3
        indentUnit = sourceIndentUnit(options.indent)
        newline = sourceNewline(context.sourceCode.text)
      },
      JSXOpeningElement(node) {
        if (node.attributes.length < minAttributes || node.loc.start.line !== node.loc.end.line) {
          return
        }

        const source = context.sourceCode
        const text = source.text
        const baseIndent = sourceLineIndent(text, node.range[0])
        const attributeIndent = baseIndent + indentUnit
        const attributes = node.attributes

        context.report({
          node,
          messageId: 'multiline',
          fix: (fixer) => {
            const last = attributes.at(-1)

            if (source.getCommentsInside(node).length > 0 || !last) {
              return null
            }

            const ranges: [number, number][] = [
              [(node.typeArguments ?? node.name).range[1], attributes[0].range[0]],
              ...attributes.slice(1).map((attribute, index): [number, number] => [attributes[index].range[1], attribute.range[0]]),
              [last.range[1], node.range[1] - (node.selfClosing ? 2 : 1)],
            ]

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
