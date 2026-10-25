import { defineRule } from '@oxlint/plugins'
import { astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import { sourceIndentSchema, sourceIndentUnit, sourceLineIndent, sourceNewline } from '../../utils/source.utils.ts'
import type * as LayoutTypes from '../../types/layout.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const layoutChain = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          groups: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                minDepth: { type: 'integer', minimum: 1 },
                methods: { type: 'array', items: { type: 'string' } },
                onlyMethods: { type: 'array', items: { type: 'string' } },
                rootPattern: optionsPatternSchema,
              },
              required: ['minDepth'],
            },
          },
          indent: sourceIndentSchema,
        },
        required: ['groups'],
      },
    ],
    messages: {
      newline: 'Put every method in this call chain on its own line.',
    },
  },
  createOnce(context) {
    let groups: LayoutTypes.LayoutChainCompiledGroup[] = []
    let indentUnit = sourceIndentUnit()
    let newline = '\n'
    let processed = new WeakSet<ESTree.CallExpression>()

    return {
      before() {
        const options = optionsFirst<LayoutTypes.LayoutChainOptions>(context, { groups: [] })
        groups = options.groups.map((group) => ({
          minDepth: group.minDepth,
          methods: group.methods ? new Set(group.methods) : undefined,
          onlyMethods: group.onlyMethods ? new Set(group.onlyMethods) : undefined,
          rootPatterns: [group.rootPattern ?? []].flat().map((pattern) => new RegExp(pattern)),
        }))
        indentUnit = sourceIndentUnit(options.indent)
        newline = sourceNewline(context.sourceCode.text)
        processed = new WeakSet<ESTree.CallExpression>()
        if (groups.length === 0) {
          return false
        }
      },
      CallExpression(node) {
        const parent = node.parent

        if (processed.has(node) || (parent.type === 'MemberExpression' && parent.object === node && parent.parent.type === 'CallExpression' && parent.parent.callee === parent)) {
          return
        }

        const links: LayoutTypes.LayoutChainLink[] = []
        let root: ESTree.Expression = node

        while (root.type === 'CallExpression' && root.callee.type === 'MemberExpression') {
          const member: ESTree.MemberExpression = root.callee
          links.unshift({
            call: root,
            member,
            methodName: astMemberName(member),
          })
          processed.add(root)
          root = member.object
        }

        let rootName: ESTree.Expression = root

        while (rootName.type === 'ChainExpression' || rootName.type === 'ParenthesizedExpression') {
          rootName = rootName.expression
        }

        const matches = groups.some(({ minDepth, methods, onlyMethods, rootPatterns }) => {
          if (links.length < minDepth) {
            return false
          }

          return (
            (!methods && !onlyMethods && rootPatterns.length === 0) ||
            (methods !== undefined && links.some((link) => link.methodName !== undefined && methods.has(link.methodName))) ||
            (onlyMethods !== undefined && links.every((link) => link.methodName !== undefined && onlyMethods.has(link.methodName))) ||
            (rootName.type === 'Identifier' && optionsPatternsTest(rootPatterns, rootName.name))
          )
        })

        if (!matches) {
          return
        }

        const source = context.sourceCode
        const text = source.text
        const chainIndent = sourceLineIndent(text, node.range[0]) + indentUnit
        const edits: LayoutTypes.LayoutEdit[] = []
        let fixable = true
        let needsFix = false

        for (const { member } of links) {
          if (member.computed) {
            fixable = false
            needsFix = true
            continue
          }

          const operatorToken = source.getTokenBefore(member.property)
          const objectEnd = (operatorToken && source.getTokenBefore(operatorToken)) ?? member.object
          const range: [number, number] = [objectEnd.range[1], member.property.range[0]]
          const gap = text.slice(...range)
          const operator = member.optional ? '?.' : '.'
          const expected = `${newline}${chainIndent}${operator}`
          const hasComments = source.commentsExistBetween(objectEnd, member.property)

          if (hasComments || gap.trim() !== operator) {
            fixable = false
          }

          const lastComment = hasComments && operatorToken ? source.getTokenBefore(operatorToken, { includeComments: true }) : null
          const alignedAfterComment = lastComment !== null && text.slice(lastComment.range[1], member.property.range[0]) === expected

          if (gap !== expected && !alignedAfterComment) {
            needsFix = true
            edits.push({ range, text: expected })
          }
        }

        if (!needsFix) {
          return
        }

        context.report({
          node,
          messageId: 'newline',
          fix: fixable ? (fixer) => edits.map((edit) => fixer.replaceTextRange(edit.range, edit.text)) : undefined,
        })
      },
    }
  },
})
