import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import {
  layoutIndentSchema,
  layoutIndentUnit,
  layoutLineIndent,
  layoutNewline,
  optionsFirst,
} from '../utils/index.ts'
import type { LayoutIndent } from '../utils/index.ts'

interface ChainGroup {
  minDepth: number
  methods?: string[]
  onlyMethods?: string[]
  rootPattern?: string
}

interface ChainNewlineOptions {
  groups: ChainGroup[]
  indent?: LayoutIndent
}

interface ChainGroupCompiled {
  minDepth: number
  methods?: Set<string>
  onlyMethods?: Set<string>
  rootPattern?: RegExp
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
    || group.rootPattern !== undefined
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
  return rootName !== null && group.rootPattern !== undefined && group.rootPattern.test(rootName)
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
              rootPattern: { type: 'string' },
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
          rootPattern: group.rootPattern === undefined ? undefined : new RegExp(group.rootPattern),
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
        const chainIndent = layoutLineIndent(text, root.range[0]) + indentUnit
        const replacements: Array<{ range: [number, number], text: string }> = []
        let fixable = true
        let needsFix = false

        for (const link of links) {
          if (link.member.computed) {
            fixable = false
            needsFix = true
            continue
          }

          const range: [number, number] = [link.member.object.range[1], link.member.property.range[0]]
          const gap = text.slice(...range)
          const operator = link.member.optional ? '?.' : '.'
          const expected = `${newline}${chainIndent}${operator}`

          if (source.commentsExistBetween(link.member.object, link.member.property) || gap.trim() !== operator) {
            fixable = false
          }
          if (gap !== expected) {
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
