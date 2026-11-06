import { defineRule } from '@oxlint/plugins'
import { astIsOneLine } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceIndentSchema, sourceIndentUnit, sourceItemGaps, sourceLineIndent, sourceNewline, sourceRespace } from '../../utils/source.utils.ts'
import type { LayoutItemsOptions } from '../../types/layout.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const layoutItems = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { indent: { ...sourceIndentSchema, default: 2 } },
      },
    ],
    messages: {
      object: 'A multi-line object puts each property on its own line.',
      array: 'A multi-line array puts each element on its own line.',
    },
  },
  createOnce(context) {
    let indentUnit = sourceIndentUnit()

    const check = (node: ESTree.ObjectExpression | ESTree.ArrayExpression) => {
      const source = context.sourceCode
      const items: readonly (ESTree.Node | null)[] = node.type === 'ObjectExpression' ? node.properties : node.elements
      const present = items.filter((item) => item !== null)
      const open = source.getFirstToken(node)
      const close = source.getLastToken(node)

      if (!open || !close || astIsOneLine(node) || present.length < 2) {
        return
      }

      const packed = [open, ...present].some((item, index) => {
        const next = present.at(index)
        return next !== undefined && item.loc.end.line === next.loc.start.line
      })

      if (!packed) {
        return
      }

      const text = source.text
      const newline = sourceNewline(text)
      const base = sourceLineIndent(text, node.range[0])
      const gaps = sourceItemGaps(open.range[1], present, close.range[0])

      context.report({
        node,
        messageId: node.type === 'ObjectExpression' ? 'object' : 'array',
        fix: (fixer) => (present.length === items.length ? sourceRespace(fixer, text, gaps, (_, end) => `${newline}${base}${end ? '' : indentUnit}`) : null),
      })
    }

    return {
      before() {
        indentUnit = sourceIndentUnit(optionsFirst<LayoutItemsOptions>(context, {}).indent)
      },
      ObjectExpression: check,
      ArrayExpression: check,
    }
  },
})
