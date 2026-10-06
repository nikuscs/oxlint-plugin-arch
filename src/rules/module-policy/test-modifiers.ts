import { defineRule } from '@oxlint/plugins'
import type { ModuleTestModifiersOptions } from '../../types/module-policy.types.ts'
import { astDottedName, optionsFirst } from '../../utils/index.ts'

/** Reject focused, skipped and placeholder tests, including renamed imports such as check.only. */
export const testModifiers = defineRule({
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
          'test',
          'it',
          'describe',
          'suite',
          ...(optionsFirst<ModuleTestModifiersOptions>(context, {}).additionalTestFunctions ?? []),
        ])
      },
      ImportDeclaration(node) {
        if (!['vitest', 'bun:test', '@playwright/test', '@jest/globals'].includes(node.source.value)) {
          return
        }
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') {
            continue
          }
          const imported =
            specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value
          if (['test', 'it', 'describe', 'suite'].includes(imported)) {
            names.add(specifier.local.name)
          }
        }
      },
      MemberExpression(node) {
        const name = astDottedName(node)
        if (!name) {
          return
        }
        const parts = name.split('.')
        if (
          [...names].some((test) => name.startsWith(test + '.')) &&
          ['only', 'skip', 'todo'].includes(parts.at(-1) ?? '')
        ) {
          context.report({ node, messageId: 'modifier' })
        }
      },
    }
  },
})
