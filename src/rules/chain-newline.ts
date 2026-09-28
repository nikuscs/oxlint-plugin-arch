import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import {
  layoutIndentSchema,
  layoutIndentUnit,
  layoutLineIndent,
  layoutNewline,
  optionsFirst,
  optionsPatterns,
  optionsPatternSchema,
  optionsPatternsTest,
} from '../utils/index.ts'
import type { LayoutIndent, OptionsPattern } from '../utils/index.ts'

interface ChainGroup {
  minDepth: number
  methods?: string[]
  onlyMethods?: string[]
  rootPattern?: OptionsPattern
}

interface ChainNewlineOptions {
  groups: ChainGroup[]
  indent?: LayoutIndent
}

interface ChainGroupCompiled {
  minDepth: number
  methods?: Set<string>
  onlyMethods?: Set<string>
  rootPatterns: RegExp[]
}

interface ChainLink {
  call: ESTree.CallExpression
  member: ESTree.MemberExpression
  methodName: string | null
}

function chainNewlineCollect(node: ESTree.CallExpression): { root: ESTree.Expression, links: ChainLink[] } {
  const links: ChainLink[] = []
  let current: ESTree.Expression = node

  while (current.type === 'CallExpression' && current.callee.type === 'MemberExpression') {
    const member: ESTree.MemberExpression = current.callee
    links.push({
      call: current,
      member,
      methodName: !member.computed && member.property.type === 'Identifier' ? member.property.name : null,
    })
    current = member.object
  }

  links.reverse()
  return { root: current, links }
}

function chainNewlineRootIdentifier(node: ESTree.Expression): string | null {
  let current = node

  while (current.type === 'ChainExpression' || current.type === 'ParenthesizedExpression') {
    current = current.expression
  }

  return current.type === 'Identifier' ? current.name : null
}

function chainNewlineMatches(root: ESTree.Expression, links: ChainLink[], group: ChainGroupCompiled): boolean {
  if (links.length < group.minDepth) return false

  const hasCriteria = group.methods !== undefined
    || group.onlyMethods !== undefined
    || group.rootPatterns.length > 0
  if (!hasCriteria) return true

  // Criteria within one group deliberately use OR semantics.
  if (group.methods && links.some(link => link.methodName !== null && group.methods?.has(link.methodName))) {
    return true
  }
  if (
    group.onlyMethods
    && links.every(link => link.methodName !== null && group.onlyMethods?.has(link.methodName))
  ) return true

  const rootName = chainNewlineRootIdentifier(root)
  return rootName !== null && optionsPatternsTest(group.rootPatterns, rootName)
}

/**
 * Puts each method call in configured matching chains on its own consistently indented line.
 * A group's methods, onlyMethods, and rootPattern criteria use OR semantics.
 *
 * Example: `source.map(fn).filter(ok)` becomes a vertically aligned method chain.
 */
export const chainNewline = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [{
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
        indent: layoutIndentSchema,
      },
      required: ['groups'],
    }],
    messages: {
      newline: 'Put every method in this call chain on its own line.',
    },
  },
  createOnce(context) {
    let groups: ChainGroupCompiled[] = []
    let indentUnit = layoutIndentUnit()
    let newline = '\n'
    let processed = new WeakSet<ESTree.CallExpression>()

    return {
      before() {
        const options = optionsFirst<ChainNewlineOptions>(context, { groups: [] })
        groups = (options.groups ?? []).map(group => ({
          minDepth: group.minDepth,
          methods: group.methods ? new Set(group.methods) : undefined,
          onlyMethods: group.onlyMethods ? new Set(group.onlyMethods) : undefined,
          rootPatterns: optionsPatterns(group.rootPattern),
        }))
        indentUnit = layoutIndentUnit(options.indent)
        newline = layoutNewline(context.sourceCode.text)
        processed = new WeakSet<ESTree.CallExpression>()
        if (groups.length === 0) return false
      },
      CallExpression(node) {
        if (processed.has(node)) return

        const parent = node.parent
        if (
          parent?.type === 'MemberExpression'
          && parent.object === node
          && parent.parent?.type === 'CallExpression'
          && parent.parent.callee === parent
        ) return

        const { root, links } = chainNewlineCollect(node)
        for (const link of links) processed.add(link.call)

        if (!groups.some(group => chainNewlineMatches(root, links, group))) return

        const source = context.sourceCode
        const text = source.text
        // Why: `node` starts at a root's opening `(`; the root itself may start on a later, deeper line.
        const chainIndent = layoutLineIndent(text, node.range[0]) + indentUnit
        const replacements: Array<{ range: [number, number], text: string }> = []
        let fixable = true
        let needsFix = false

        for (const link of links) {
          if (link.member.computed) {
            fixable = false
            needsFix = true
            continue
          }

          // Why: ESTree drops parentheses, so measure from the token before `.` to skip a closing `)`.
          const operatorToken = source.getTokenBefore(link.member.property)
          const objectEnd = (operatorToken && source.getTokenBefore(operatorToken)) ?? link.member.object
          const range: [number, number] = [objectEnd.range[1], link.member.property.range[0]]
          const gap = text.slice(...range)
          const operator = link.member.optional ? '?.' : '.'
          const expected = `${newline}${chainIndent}${operator}`

          const hasComments = source.commentsExistBetween(objectEnd, link.member.property)
          if (hasComments || gap.trim() !== operator) {
            fixable = false
          }
          const lastComment = hasComments && operatorToken
            ? source.getTokenBefore(operatorToken, { includeComments: true })
            : null
          const alignedAfterComment = lastComment !== null
            && text.slice(lastComment.range[1], link.member.property.range[0]) === expected
          if (gap !== expected && !alignedAfterComment) {
            needsFix = true
            replacements.push({ range, text: expected })
          }
        }

        if (!needsFix) return

        context.report({
          node,
          messageId: 'newline',
          fix: fixable
            ? fixer => replacements.map(replacement => fixer.replaceTextRange(replacement.range, replacement.text))
            : undefined,
        })
      },
    }
  },
})
