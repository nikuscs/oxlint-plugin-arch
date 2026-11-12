import { defineRule } from '@oxlint/plugins'
import { astIsOneLine } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceIndentSchema, sourceIndentUnit, sourceItemGaps, sourceLineIndent, sourceNewline } from '../../utils/source.utils.ts'
import type { LayoutTypeArgumentsOptions } from '../../types/layout.types.ts'

export const layoutTypeArguments = defineRule({
  meta: {
    type: 'layout',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          min: { type: 'integer', minimum: 2, default: 3 },
          indent: { ...sourceIndentSchema, default: 2 },
        },
      },
    ],
    messages: {
      union: 'A union of {{min}}+ types in type arguments puts each type on its own line.',
    },
  },
  createOnce(context) {
    let minMembers = 3
    let indentUnit = sourceIndentUnit()

    return {
      before() {
        const options = optionsFirst<LayoutTypeArgumentsOptions>(context, {})
        minMembers = options.min ?? 3
        indentUnit = sourceIndentUnit(options.indent)
      },
      TSTypeParameterInstantiation(node) {
        const unions = node.params.flatMap((param) => (param.type === 'TSUnionType' && param.types.length >= minMembers ? [param] : []))

        if (unions.length === 0 || !astIsOneLine(node)) {
          return
        }

        const source = context.sourceCode
        const text = source.text
        const items = node.params.flatMap((param) => (param.type === 'TSUnionType' && unions.includes(param) ? param.types : [param]))
        const gaps = sourceItemGaps(node.range[0] + 1, items, node.range[1] - 1)
        const firsts = new Set(unions.map((union) => union.types[0]))
        const matches = gaps.map((gap) => /^\s*(,?)\s*(\|?)\s*$/.exec(text.slice(...gap)))
        const newline = sourceNewline(text)
        const base = sourceLineIndent(text, node.range[0])
        const inner = `${base}${indentUnit}`

        const unsafe = text[node.range[0]] !== '<' || text[node.range[1] - 1] !== '>' || source.getCommentsInside(node).length > 0 || matches.some((match) => !match)

        context.report({
          node,
          messageId: 'union',
          data: { min: String(minMembers) },
          fix: unsafe
            ? undefined
            : (fixer) =>
              gaps.map((gap, index) => {
                const comma = matches[index]?.[1] ?? ''
                const next = items.at(index)
                const bar = matches[index]?.[2] || (next && firsts.has(next)) ? '| ' : ''

                return fixer.replaceTextRange(gap, next ? `${comma}${newline}${inner}${bar}` : `${comma}${newline}${base}`)
              }),
        })
      },
    }
  },
})
