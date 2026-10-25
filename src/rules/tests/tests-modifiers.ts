import { defineRule } from '@oxlint/plugins'
import { astDottedName, astModuleName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { TestsModifiersOptions } from '../../types/tests.types.ts'

const testsModifiersNames = ['test', 'it', 'describe', 'suite']

const testsModifiersPackages = new Set(['vitest', 'bun:test', '@playwright/test', '@jest/globals'])

const testsModifiersBanned = new Set(['only', 'skip', 'todo'])

export const testsModifiers = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { functions: { type: 'array', items: { type: 'string' } } },
      },
    ],
    messages: {
      modifier: 'Focused, skipped and placeholder tests are not allowed.',
    },
  },
  createOnce(context) {
    let names = new Set<string>()

    return {
      before() {
        names = new Set([
          ...testsModifiersNames,
          ...(optionsFirst<TestsModifiersOptions>(context, {}).functions ?? []),
        ])
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
        const name = astDottedName(node)

        if (!name || !testsModifiersBanned.has(name.split('.').at(-1) ?? '')) {
          return
        }

        if ([...names].some((test) => name.startsWith(`${test}.`))) {
          context.report({ node, messageId: 'modifier' })
        }
      },
    }
  },
})
