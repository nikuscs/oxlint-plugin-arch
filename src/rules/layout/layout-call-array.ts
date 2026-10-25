import { defineRule } from '@oxlint/plugins'
import { astDottedName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceIndentSchema, sourceIndentUnit, sourceLineIndent, sourceNewline } from '../../utils/source.utils.ts'
import type { LayoutCallArrayOptions, LayoutEdit } from '../../types/layout.types.ts'
import type { ESTree, Scope } from '@oxlint/plugins'

const layoutCallArrayDefaultCallees = ['Promise.all', 'Promise.allSettled']

function layoutCallArrayRoot(node: ESTree.Expression): ESTree.Expression {
  return node.type === 'MemberExpression' ? layoutCallArrayRoot(node.object) : node
}

export const layoutCallArray = defineRule({
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
          indent: sourceIndentSchema,
        },
      },
    ],
    messages: {
      multiline: 'Put every array element in this call on its own line.',
    },
  },
  createOnce(context) {
    let callees = new Set(layoutCallArrayDefaultCallees)
    let minElements = 2
    let indentUnit = sourceIndentUnit()
    let newline = '\n'

    return {
      before() {
        const options = optionsFirst<LayoutCallArrayOptions>(context, {})
        callees = new Set(options.callees ?? layoutCallArrayDefaultCallees)
        minElements = options.minElements ?? 2
        indentUnit = sourceIndentUnit(options.indent)
        newline = sourceNewline(context.sourceCode.text)
        if (callees.size === 0) {
          return false
        }
      },
      CallExpression(node) {
        const name = astDottedName(node.callee)

        if (!name || !callees.has(name)) {
          return
        }

        const array = node.arguments.at(0)

        if (array?.type !== 'ArrayExpression' || array.elements.length < minElements) {
          return
        }

        if (array.loc.start.line !== array.loc.end.line) {
          return
        }

        const source = context.sourceCode
        const root = layoutCallArrayRoot(node.callee)

        if (root.type === 'Identifier' && root.name === 'Promise') {
          let scope: Scope | null = source.getScope(root)

          while (scope && !scope.set.has(root.name)) {
            scope = scope.upper
          }

          if ((scope?.set.get(root.name)?.defs.length ?? 0) > 0) {
            return
          }
        }

        const text = source.text
        const baseIndent = sourceLineIndent(text, array.range[0])
        const elementIndent = baseIndent + indentUnit

        context.report({
          node: array,
          messageId: 'multiline',
          fix: (fixer) => {
            const elements = array.elements.filter((element) => element !== null)

            if (source.getCommentsInside(array).length > 0 || elements.length !== array.elements.length) {
              return null
            }

            const ranges = elements.map((element): [number, number] => {
              let range: [number, number] = [element.range[0], element.range[1]]
              let before = source.getTokenBefore(element)
              let after = source.getTokenAfter(element)

              while (before?.value === '(' && after?.value === ')') {
                range = [before.range[0], after.range[1]]
                before = source.getTokenBefore(before)
                after = source.getTokenAfter(after)
              }

              return range
            })

            const [first] = ranges
            const last = ranges.at(-1)

            if (!last) {
              return null
            }

            const opening: [number, number] = [array.range[0] + 1, first[0]]

            if (!/^\s*$/.test(text.slice(...opening))) {
              return null
            }

            const edits: LayoutEdit[] = [{ range: opening, text: `${newline}${elementIndent}` }]

            for (let index = 1; index < ranges.length; index++) {
              const previous = ranges[index - 1]
              const current = ranges[index]

              if (!/^,\s*$/.test(text.slice(previous[1], current[0]))) {
                return null
              }
              edits.push({ range: [previous[1] + 1, current[0]], text: `${newline}${elementIndent}` })
            }

            const closingGap = text.slice(last[1], array.range[1] - 1)

            if (!/^,?\s*$/.test(closingGap)) {
              return null
            }
            edits.push({
              range: [last[1] + (closingGap.startsWith(',') ? 1 : 0), array.range[1] - 1],
              text: `${newline}${baseIndent}`,
            })

            return edits.map((edit) => fixer.replaceTextRange(edit.range, edit.text))
          },
        })
      },
    }
  },
})
