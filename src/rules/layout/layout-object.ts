import { defineRule } from '@oxlint/plugins'
import { astDottedName, astIsInlineFunction, astIsOneLine } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import {
  sourceIndentSchema,
  sourceIndentUnit,
  sourceItemGaps,
  sourceJoinedWidth,
  sourceLineIndent,
  sourceNewline,
  sourceRespace,
} from '../../utils/source.utils.ts'
import type { LayoutObjectOptions, LayoutObjectScope } from '../../types/layout.types.ts'
import type { ESTree } from '@oxlint/plugins'

function layoutObjectIsWhitespace(text: string): boolean {
  return /^[\t\n\r\f ]*$/.test(text)
}

function layoutObjectIsFlat(property: ESTree.ObjectExpression['properties'][number]): boolean {
  const value = property.type === 'SpreadElement' ? property.argument : property.value

  return (
    astIsOneLine(property) &&
    (property.type === 'SpreadElement' || (!property.method && property.kind === 'init')) &&
    value.type !== 'ObjectExpression' &&
    value.type !== 'ArrayExpression' &&
    !astIsInlineFunction(value)
  )
}

export const layoutObject = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          min: { type: 'integer', minimum: 1, default: 3 },
          scope: { type: 'string', enum: ['call-args', 'all'], default: 'call-args' },
          indent: { ...sourceIndentSchema, default: 2 },
          join: {
            type: 'object',
            additionalProperties: false,
            required: ['max'],
            properties: {
              max: { type: 'integer', minimum: 1 },
              keep: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    ],
    messages: {
      callArgs: 'Object with {{min}}+ properties in a call should have each property on its own line.',
      always: 'Object with {{min}}+ properties should have each property on its own line.',
      join: 'This object fits on one line, so keep it on one line.',
    },
  },
  createOnce(context) {
    let minProperties = 3
    let scope: LayoutObjectScope = 'call-args'
    let indentUnit = sourceIndentUnit()
    let newline = '\n'
    let join: LayoutObjectOptions['join']

    return {
      before() {
        const options = optionsFirst<LayoutObjectOptions>(context, {})
        minProperties = options.min ?? 3
        scope = options.scope ?? 'call-args'
        indentUnit = sourceIndentUnit(options.indent)
        newline = sourceNewline(context.sourceCode.text)
        join = options.join
      },
      ObjectExpression(node) {
        const source = context.sourceCode
        const text = source.text
        const properties = node.properties
        const split = properties.length >= minProperties

        if (split ? !astIsOneLine(node) : !join || astIsOneLine(node)) {
          return
        }

        const parent = node.parent
        const call = (parent.type === 'CallExpression' || parent.type === 'NewExpression') && parent.arguments.includes(node) ? parent : undefined

        if (scope === 'call-args' && !call) {
          return
        }

        if (!split) {
          const callee = call ? astDottedName(call.callee) : undefined
          const kept = callee !== undefined && (join?.keep ?? []).some((name) => callee === name || callee.endsWith(`.${name}`))

          if (kept || properties.length === 0 || !properties.every(layoutObjectIsFlat) || source.getCommentsInside(node).length > 0) {
            return
          }

          const gaps = sourceItemGaps(node.range[0] + 1, properties, node.range[1] - 1)
          const comma = text.slice(...(gaps.at(-1) ?? [0, 0])).includes(',') ? ',' : ''
          const joined = ` ${properties.map((property) => source.getText(property)).join(', ')}${comma} `

          if (sourceJoinedWidth(text, node.range[0] + 1, joined, node.range[1] - 1) > (join?.max ?? 0)) {
            return
          }

          context.report({
            node,
            messageId: 'join',
            fix: (fixer) => sourceRespace(fixer, text, gaps, () => ' '),
          })

          return
        }

        const baseIndent = sourceLineIndent(text, node.range[0])
        const propertyIndent = `${baseIndent}${indentUnit}`
        const close = node.range[1] - 1

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
              gaps.push([after + comma + 1, limit])
            }

            return gaps.map((gap, index) =>
              fixer.replaceTextRange(gap, index === gaps.length - 1 ? `${newline}${baseIndent}` : `${newline}${propertyIndent}`),
            )
          },
        })
      },
    }
  },
})
