import { defineRule } from '@oxlint/plugins'
import { astDottedName, astModuleName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { TestsModifiersOptions } from '../../types/tests.types.ts'

const testNames = ['test', 'it', 'describe', 'suite']

const testPackages = new Set(['vitest', 'bun:test', '@playwright/test', '@jest/globals'])

const modifiers = new Set(['only', 'skip', 'todo'])

export const testsModifiers = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { additionalTestFunctions: { type: 'array', items: { type: 'string' } } },
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
          ...testNames,
          ...(optionsFirst<TestsModifiersOptions>(context, {}).additionalTestFunctions ?? []),
        ])
      },
      ImportDeclaration(node) {
        if (!testPackages.has(node.source.value)) {
          return
        }

        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') {
            continue
          }

          const imported = astModuleName(specifier.imported)

          if (testNames.includes(imported)) {
            names.add(specifier.local.name)
          }
        }
      },
      MemberExpression(node) {
        const name = astDottedName(node)

        if (!name || !modifiers.has(name.split('.').at(-1) ?? '')) {
          return
        }

        if ([...names].some((test) => name.startsWith(`${test}.`))) {
          context.report({ node, messageId: 'modifier' })
        }
      },
    }
  },
})
