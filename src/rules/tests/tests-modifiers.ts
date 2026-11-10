import { defineRule } from '@oxlint/plugins'
import { astMemberName, astModuleName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { TestsModifiersOptions } from '../../types/tests.types.ts'
import type { ESTree } from '@oxlint/plugins'

const testsModifiersNames = ['test', 'it', 'describe', 'suite']

const testsModifiersPackages = new Set(['vitest', 'bun:test', '@playwright/test', '@jest/globals'])

const testsModifiersBanned = ['only', 'skip', 'todo']

const testsModifiersBuilders = new Set(['if', 'runIf', 'skipIf'])

function modifierName(node: ESTree.Node): string | undefined {
  if (node.type === 'Identifier') {
    return node.name
  }

  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && testsModifiersBuilders.has(astMemberName(node.callee) ?? '')) {
    return modifierName(node.callee)
  }

  if (node.type !== 'MemberExpression') {
    return undefined
  }

  const object = modifierName(node.object)
  const property = astMemberName(node)
  return object && property ? `${object}.${property}` : undefined
}

export const testsModifiers = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          functions: { type: 'array', items: { type: 'string' } },
          modifiers: { type: 'array', items: { type: 'string', minLength: 1 }, default: testsModifiersBanned },
        },
      },
    ],
    messages: {
      modifier: 'Focused, skipped and placeholder tests are not allowed.',
    },
  },
  createOnce(context) {
    let names = new Set<string>()
    let banned = new Set<string>()

    return {
      before() {
        const options = optionsFirst<TestsModifiersOptions>(context, {})
        names = new Set([...testsModifiersNames, ...(options.functions ?? [])])
        banned = new Set(options.modifiers ?? testsModifiersBanned)
      },
      ImportDeclaration(node) {
        if (!testsModifiersPackages.has(node.source.value)) {
          return
        }

        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') {
            continue
          }

          const imported = astModuleName(specifier.imported)

          if (testsModifiersNames.includes(imported)) {
            names.add(specifier.local.name)
          }
        }
      },
      MemberExpression(node) {
        const name = modifierName(node)

        if (!name || !banned.has(name.split('.').at(-1) ?? '')) {
          return
        }

        if ([...names].some((test) => name.startsWith(`${test}.`))) {
          context.report({ node, messageId: 'modifier' })
        }
      },
    }
  },
})
