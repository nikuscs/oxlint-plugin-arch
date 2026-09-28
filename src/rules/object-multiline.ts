import { defineRule } from '@oxlint/plugins'
import {
  layoutIndentSchema,
  layoutIndentUnit,
  layoutLineIndent,
  layoutNewline,
  optionsFirst,
} from '../utils/index.ts'
import type { LayoutIndent } from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface ObjectMultilineOptions {
  minProperties?: number
  scope?: 'call-args' | 'all'
  indent?: LayoutIndent
}

function objectMultilineIsCallArg(node: ESTree.ObjectExpression): boolean {
  const parent = node.parent
  return (parent.type === 'CallExpression' || parent.type === 'NewExpression') && parent.arguments.includes(node)
}

function objectMultilineIsWhitespace(text: string): boolean {
  return /^[\t\n\r\f ]*$/.test(text)
}

function objectMultilineGaps(text: string, node: ESTree.ObjectExpression): Array<[number, number]> | null {
  const gaps: Array<[number, number]> = []
  const close = node.range[1] - 1
  const first = node.properties[0]
  if (!objectMultilineIsWhitespace(text.slice(node.range[0] + 1, first.range[0]))) {
    return null
  }
  gaps.push([node.range[0] + 1, first.range[0]])

  for (let index = 0; index < node.properties.length; index++) {
    const property = node.properties[index]
    const next = node.properties[index + 1]
    const after = property.range[1]
    const limit = next ? next.range[0] : close
    const between = text.slice(after, limit)
    const comma = between.indexOf(',')
    if (comma === -1) {
      if (next || !objectMultilineIsWhitespace(between)) {
        return null
      }
      gaps.push([after, close])
      continue
    }

    if (!objectMultilineIsWhitespace(between.slice(0, comma)) || !objectMultilineIsWhitespace(between.slice(comma + 1))) {
      return null
    }
    gaps.push([after + comma + 1, limit])
  }

  return gaps
}

/**
 * Splits a single-line object literal with enough properties onto one property per line.
 *
 * Example: `save({ id, name, email })` becomes a multiline object; two-property objects stay put.
 */
export const objectMultiline = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        minProperties: { type: 'integer', minimum: 1, default: 3 },
        scope: { type: 'string', enum: ['call-args', 'all'], default: 'call-args' },
        indent: { ...layoutIndentSchema, default: 2 },
      },
    }],
    messages: {
      callArgs: 'Object with {{min}}+ properties in a call should have each property on its own line.',
      always: 'Object with {{min}}+ properties should have each property on its own line.',
    },
  },
  createOnce(context) {
    let minProperties = 3
    let scope: NonNullable<ObjectMultilineOptions['scope']> = 'call-args'
    let indentUnit = layoutIndentUnit()
    let newline = '\n'

    return {
      before() {
        const options = optionsFirst<ObjectMultilineOptions>(context, {})
        minProperties = options.minProperties ?? 3
        scope = options.scope ?? 'call-args'
        indentUnit = layoutIndentUnit(options.indent)
        newline = layoutNewline(context.sourceCode.text)
      },
      ObjectExpression(node) {
        if (node.properties.length < minProperties || node.loc.start.line !== node.loc.end.line) {
          return
        }
        if (scope === 'call-args' && !objectMultilineIsCallArg(node)) {
          return
        }

        const source = context.sourceCode
        const gaps = source.getCommentsInside(node).length > 0 ? null : objectMultilineGaps(source.text, node)
        const baseIndent = layoutLineIndent(source.text, node.range[0])
        const propIndent = `${baseIndent}${indentUnit}`

        context.report({
          node,
          messageId: scope === 'all' ? 'always' : 'callArgs',
          data: { min: String(minProperties) },
          fix(fixer) {
            if (!gaps) {
              return null
            }
            return gaps.map((gap, index) => fixer.replaceTextRange(
              gap,
              `${newline}${index === gaps.length - 1 ? baseIndent : propIndent}`,
            ))
          },
        })
      },
    }
  },
})
