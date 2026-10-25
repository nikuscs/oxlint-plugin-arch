import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceIndentSchema, sourceIndentUnit, sourceLineIndent, sourceNewline } from '../../utils/source.utils.ts'
import type { LayoutObjectOptions, LayoutObjectScope } from '../../types/layout.types.ts'

function layoutObjectIsWhitespace(text: string): boolean {
  return /^[\t\n\r\f ]*$/.test(text)
}

export const layoutObject = defineRule({
  meta: {
    type: 'layout',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          minProperties: { type: 'integer', minimum: 1, default: 3 },
          scope: { type: 'string', enum: ['call-args', 'all'], default: 'call-args' },
          indent: { ...sourceIndentSchema, default: 2 },
        },
      },
    ],
    messages: {
      callArgs: 'Object with {{min}}+ properties in a call should have each property on its own line.',
      always: 'Object with {{min}}+ properties should have each property on its own line.',
    },
  },
  createOnce(context) {
    let minProperties = 3
    let scope: LayoutObjectScope = 'call-args'
    let indentUnit = sourceIndentUnit()
    let newline = '\n'

    return {
      before() {
        const options = optionsFirst<LayoutObjectOptions>(context, {})
        minProperties = options.minProperties ?? 3
        scope = options.scope ?? 'call-args'
        indentUnit = sourceIndentUnit(options.indent)
        newline = sourceNewline(context.sourceCode.text)
      },
      ObjectExpression(node) {
        if (node.properties.length < minProperties || node.loc.start.line !== node.loc.end.line) {
          return
        }

        const parent = node.parent

        if (scope === 'call-args' && !((parent.type === 'CallExpression' || parent.type === 'NewExpression') && parent.arguments.includes(node))) {
          return
        }

        const source = context.sourceCode
        const text = source.text
        const baseIndent = sourceLineIndent(text, node.range[0])
        const propertyIndent = `${baseIndent}${indentUnit}`
        const close = node.range[1] - 1
        const properties = node.properties

        context.report({
          node,
          messageId: scope === 'all' ? 'always' : 'callArgs',
          data: { min: String(minProperties) },
          fix: (fixer) => {
            if (source.getCommentsInside(node).length > 0 || !layoutObjectIsWhitespace(text.slice(node.range[0] + 1, properties[0].range[0]))) {
              return null
            }

            const gaps: [number, number][] = [[node.range[0] + 1, properties[0].range[0]]]

            for (const [index, property] of properties.entries()) {
              const next = properties.at(index + 1)
              const after = property.range[1]
              const limit = next ? next.range[0] : close
              const between = text.slice(after, limit)
              const comma = between.indexOf(',')

              if (comma === -1) {
                if (next || !layoutObjectIsWhitespace(between)) {
                  return null
                }
                gaps.push([after, close])
                continue
              }

              if (!layoutObjectIsWhitespace(between.slice(0, comma)) || !layoutObjectIsWhitespace(between.slice(comma + 1))) {
                return null
              }
              gaps.push([next ? after + comma + 1 : after, limit])
            }

            return gaps.map((gap, index) =>
              fixer.replaceTextRange(gap, index === gaps.length - 1 ? `,${newline}${baseIndent}` : `${newline}${propertyIndent}`),
            )
          },
        })
      },
    }
  },
})
