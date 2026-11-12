import { defineRule } from '@oxlint/plugins'
import { astDottedName, astIsCall, astIsInlineFunction, astIsOneLine } from '../../utils/ast.utils.ts'
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
          params: { type: 'boolean', default: false },
          nested: { type: 'boolean', default: false },
          siblings: { type: 'boolean', default: false },
          inner: { type: 'integer', minimum: 1 },
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
      nested: 'An object holding an object or function should have each property on its own line.',
      nestedName: 'An object holding an object or function should have each property on its own line. Name this call first: split here, it would break a chained call or a ternary.',
      siblings: 'A sibling call in this list splits its object; split this one too.',
      inner: 'An object with {{inner}}+ entries inside a split object should have each entry on its own line.',
      params: 'Destructured parameter with {{min}}+ properties should have each property on its own line.',
      join: 'This object fits on one line, so keep it on one line.',
    },
  },
  createOnce(context) {
    let minProperties = 3
    let scope: LayoutObjectScope = 'call-args'
    let indentUnit = sourceIndentUnit()
    let newline = '\n'
    let join: LayoutObjectOptions['join']
    let params = false
    let nested = false
    let siblings = false
    let inner: number | undefined

    function holdsNested(node: ESTree.ObjectExpression): boolean {
      return (
        nested &&
        astIsOneLine(node) &&
        node.properties.some(
          (property) =>
            property.type === 'Property' &&
            ((property.value.type === 'ObjectExpression' && property.value.properties.length > 0) || astIsInlineFunction(property.value)),
        ) &&
        !insideOneLineObject(node.parent)
      )
    }

    function insideOneLineObject(start: ESTree.Node): boolean {
      for (let ancestor: ESTree.Node | null = start; ancestor && !ancestor.type.endsWith('Statement'); ancestor = ancestor.parent) {
        if (ancestor.type === 'ObjectExpression' && astIsOneLine(ancestor)) {
          return true
        }
      }

      return false
    }

    function breaksAround(node: ESTree.Node): boolean {
      for (let child = node, parent = node.parent; parent; child = parent, parent = parent.parent) {
        if (parent.type === 'ConditionalExpression' || (parent.type === 'MemberExpression' && parent.object === child && astIsCall(child))) {
          return true
        }

        if (astIsInlineFunction(parent) || parent.type.endsWith('Statement') || parent.type.endsWith('Declaration')) {
          return false
        }
      }

      return false
    }

    function splitInner(node: ESTree.ObjectExpression): boolean {
      const parent = node.parent

      return (
        inner !== undefined &&
        node.properties.length >= inner &&
        astIsOneLine(node) &&
        parent.type === 'Property' &&
        parent.value === node &&
        !astIsOneLine(parent.parent)
      )
    }

    function splitSibling(node: ESTree.ObjectExpression): boolean {
      const call = node.parent
      const list = call.parent

      if (!siblings || !astIsOneLine(node) || !astIsCall(call) || list?.type !== 'ArrayExpression') {
        return false
      }

      const index = call.arguments.indexOf(node)
      const callee = context.sourceCode.getText(call.callee)

      return list.elements.some(
        (element) =>
          element !== call &&
          element !== null &&
          astIsCall(element) &&
          context.sourceCode.getText(element.callee) === callee &&
          element.arguments[index]?.type === 'ObjectExpression' &&
          !astIsOneLine(element.arguments[index]),
      )
    }

    function reportSplit(
      node: ESTree.Node,
      properties: readonly ESTree.Node[],
      open: number,
      close: number,
      messageId: 'callArgs' | 'always' | 'nested' | 'nestedName' | 'siblings' | 'inner' | 'params',
    ) {
      const source = context.sourceCode
      const text = source.text
      const baseIndent = sourceLineIndent(text, open)
      const propertyIndent = `${baseIndent}${indentUnit}`

      context.report({
        node,
        messageId,
        data: { min: String(minProperties), inner: String(inner ?? '') },
        fix: (fixer) => {
          if (messageId === 'nestedName' || source.getCommentsInside(node).length > 0 || !layoutObjectIsWhitespace(text.slice(open + 1, properties[0].range[0]))) {
            return null
          }

          const gaps: [number, number][] = [[open + 1, properties[0].range[0]]]

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
    }

    function checkParams(node: ESTree.Function | ESTree.ArrowFunctionExpression) {
      if (!params) {
        return
      }

      for (const param of node.params) {
        const pattern = param.type === 'AssignmentPattern' ? param.left : param

        if (pattern.type !== 'ObjectPattern' || pattern.properties.length < minProperties) {
          continue
        }

        const text = context.sourceCode.text
        const close = text.lastIndexOf('}', (pattern.typeAnnotation?.range[0] ?? pattern.range[1]) - 1)

        if (!text.slice(pattern.range[0], close).includes('\n')) {
          reportSplit(pattern, pattern.properties, pattern.range[0], close, 'params')
        }
      }
    }

    return {
      before() {
        const options = optionsFirst<LayoutObjectOptions>(context, {})
        minProperties = options.min ?? 3
        scope = options.scope ?? 'call-args'
        indentUnit = sourceIndentUnit(options.indent)
        newline = sourceNewline(context.sourceCode.text)
        join = options.join
        params = options.params ?? false
        nested = options.nested ?? false
        siblings = options.siblings ?? false
        inner = options.inner
      },
      FunctionDeclaration: checkParams,
      FunctionExpression: checkParams,
      ArrowFunctionExpression: checkParams,
      ObjectExpression(node) {
        const source = context.sourceCode
        const text = source.text
        const properties = node.properties
        const parent = node.parent
        const full = properties.length >= minProperties

        const holds = !full && holdsNested(node)

        if (!full && !holds && splitSibling(node)) {
          reportSplit(node, properties, node.range[0], node.range[1] - 1, 'siblings')
          return
        }

        if (splitInner(node)) {
          reportSplit(node, properties, node.range[0], node.range[1] - 1, 'inner')
          return
        }

        const split = full || holds

        if (split ? !astIsOneLine(node) : !join || astIsOneLine(node)) {
          return
        }

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

        const messageId = scope === 'all' ? 'always' : 'callArgs'

        const nestedId = breaksAround(node) ? 'nestedName' : 'nested'

        reportSplit(node, properties, node.range[0], node.range[1] - 1, holds ? nestedId : messageId)
      },
    }
  },
})
