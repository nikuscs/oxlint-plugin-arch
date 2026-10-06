import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import type { ModuleTestAssertionsOptions } from '../../types/module-policy.types.ts'
import { astVisit, optionsFirst } from '../../utils/index.ts'
import type { AstRuntimeFunction } from '../../utils/helpers/ast.ts'
import { testAssertionFunctions } from '../../constants/test.constants.ts'
import {
  testTablesRegistration,
  testTablesRows,
  testTablesResolve,
  testTablesCallName,
  testTablesAssertionPattern,
} from '../../utils/helpers/test-tables.ts'

/** Check assertion presence and placement, including assertions called through static table rows. */
export const testAssertions = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          additionalTestFunctions: { type: 'array', items: { type: 'string' } },
          additionalAssertionFunctions: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
    messages: {
      missing:
        'This test has no recognized assertion in every case. Assert the result directly or call its assertion helper. Register imported assertion helpers only after verifying that they fail on incorrect results.',
      standalone:
        'Put this assertion inside a test or an assertion helper. Table-row assertion callbacks must belong to a registered test.',
    },
  },
  createOnce(context) {
    return {
      'Program:exit'(program) {
        const options = optionsFirst<ModuleTestAssertionsOptions>(context, {})
        const tests = ['test', 'it', ...(options.additionalTestFunctions ?? [])]
        const functions = new Map<ESTree.Node, AstRuntimeFunction>()
        const values = new Map<ESTree.Node, ESTree.Expression>()
        const patterns = [
          ...testAssertionFunctions,
          'assert.*',
          ...(options.additionalAssertionFunctions ?? []),
        ].map(testTablesAssertionPattern)
        const aliases = new Map<ESTree.Node, string>()
        const shadowed = new Set<ESTree.Node>()
        const calls: ESTree.CallExpression[] = []
        const allowed = new Set<AstRuntimeFunction>()
        const assertionRoots = new Set(
          [...testAssertionFunctions, ...(options.additionalAssertionFunctions ?? [])].map(
            (name) => name.split('.')[0],
          ),
        )

        astVisit(program, [], (node) => {
          if (node.type === 'CallExpression') calls.push(node)
          if (
            ![
              'VariableDeclarator',
              'FunctionDeclaration',
              'FunctionExpression',
              'ArrowFunctionExpression',
              'ImportDeclaration',
            ].includes(node.type)
          )
            return
          for (const variable of context.sourceCode.getDeclaredVariables(node)) {
            const native =
              node.type === 'ImportDeclaration' &&
              ['vitest', '@jest/globals', '@playwright/test'].includes(node.source.value)
            if (assertionRoots.has(variable.name) && node.type !== 'ImportDeclaration') {
              for (const reference of variable.references) shadowed.add(reference.identifier)
            }
            if (native && node.type === 'ImportDeclaration') {
              const specifier = node.specifiers.find((entry) => entry.local.name === variable.name)
              if (specifier?.type === 'ImportSpecifier') {
                const imported =
                  specifier.imported.type === 'Identifier'
                    ? specifier.imported.name
                    : specifier.imported.value
                if (['test', 'it'].includes(imported)) tests.push(variable.name)
                if (assertionRoots.has(imported)) {
                  for (const reference of variable.references) aliases.set(reference.identifier, imported)
                }
              }
            }
            const fn =
              node.type === 'FunctionDeclaration'
                ? node
                : node.type === 'VariableDeclarator'
                  ? node.init
                  : undefined
            if (
              fn?.type === 'FunctionDeclaration' ||
              fn?.type === 'FunctionExpression' ||
              fn?.type === 'ArrowFunctionExpression'
            ) {
              for (const reference of variable.references) functions.set(reference.identifier, fn)
              allowed.add(fn)
            }
            if (
              node.type === 'VariableDeclarator' &&
              node.init &&
              node.parent.type === 'VariableDeclaration' &&
              node.parent.kind === 'const'
            ) {
              for (const reference of variable.references) values.set(reference.identifier, node.init)
            }
          }
        })

        function assertionName(call: ESTree.CallExpression): string | undefined {
          let root: ESTree.Node = call.callee
          while (root.type === 'MemberExpression' || root.type === 'CallExpression')
            root = root.type === 'MemberExpression' ? root.object : root.callee
          if (shadowed.has(root)) return
          const name = testTablesCallName(call.callee)
          const alias = aliases.get(root)
          return alias && name && root.type === 'Identifier' ? alias + name.slice(root.name.length) : name
        }

        function hasAssertion(
          fn: AstRuntimeFunction,
          bindings: Map<ESTree.Node, AstRuntimeFunction>,
          seen: Set<AstRuntimeFunction>,
        ): boolean {
          if (seen.has(fn)) return false
          seen.add(fn)
          let found = false
          astVisit(fn.body, [], (node, ancestors) => {
            if (found || node.type !== 'CallExpression') return
            if (
              ancestors.some(
                (ancestor) =>
                  ancestor.type === 'FunctionDeclaration' ||
                  ((ancestor.type === 'FunctionExpression' || ancestor.type === 'ArrowFunctionExpression') &&
                    ancestor.parent.type !== 'CallExpression'),
              )
            )
              return
            const name = assertionName(node)
            if (name && patterns.some((pattern) => pattern.test(name))) found = true
            else {
              const helper = bindings.get(node.callee) ?? functions.get(node.callee)
              if (helper) found = hasAssertion(helper, bindings, seen)
            }
          })
          return found
        }

        for (const call of calls) {
          const name = testTablesCallName(call.callee)
          const argument = call.arguments[0]
          if (
            tests.some((test) => name === test + '.extend') &&
            argument &&
            argument.type !== 'SpreadElement'
          ) {
            const fixtures = testTablesResolve(argument, values)
            if (fixtures.type === 'ObjectExpression') {
              for (const property of fixtures.properties) {
                if (property.type !== 'Property') continue
                let value: ESTree.Node = property.value
                if (value.type === 'ArrayExpression' && value.elements[0]) value = value.elements[0]
                const fn = functions.get(value) ?? value
                if (
                  fn.type === 'FunctionExpression' ||
                  fn.type === 'ArrowFunctionExpression' ||
                  fn.type === 'FunctionDeclaration'
                )
                  allowed.add(fn)
              }
            }
          }
          const registration = testTablesRegistration(call, tests, functions)
          if (!registration) continue
          allowed.add(registration.callback)
          const builder =
            call.callee.type === 'CallExpression' ? testTablesCallName(call.callee.callee) : undefined
          const parameter = registration.callback.params[builder?.endsWith('.for') ? 1 : 0]
          if (!builder?.endsWith('.each') && parameter?.type === 'ObjectPattern') {
            const variables = context.sourceCode.getDeclaredVariables(registration.callback)
            for (const property of parameter.properties) {
              if (
                property.type !== 'Property' ||
                property.computed ||
                property.key.type !== 'Identifier' ||
                property.key.name !== 'expect' ||
                property.value.type !== 'Identifier'
              )
                continue
              const variable = variables.find((entry) =>
                entry.identifiers.some((identifier) => identifier === property.value),
              )
              for (const reference of variable?.references ?? []) {
                shadowed.delete(reference.identifier)
                aliases.set(reference.identifier, 'expect')
              }
            }
          }
          const rows = testTablesRows(registration, context.sourceCode, values, functions)
          for (const row of rows ?? []) for (const callback of row.callbacks) allowed.add(callback)
          const valid = rows
            ? rows.length > 0 &&
              rows.every((row) => hasAssertion(registration.callback, row.bindings, new Set()))
            : hasAssertion(registration.callback, new Map(), new Set())
          if (!valid) context.report({ node: call, messageId: 'missing' })
        }
        for (const call of calls) {
          const name = assertionName(call)
          if (!name || !testAssertionFunctions.includes(name) || !name.startsWith('expect')) continue
          let parent: ESTree.Node | undefined = call.parent
          let inside = false
          while (parent && parent.type !== 'Program') {
            if (
              (parent.type === 'FunctionDeclaration' ||
                parent.type === 'FunctionExpression' ||
                parent.type === 'ArrowFunctionExpression') &&
              allowed.has(parent)
            ) {
              inside = true
              break
            }
            parent = parent.parent
          }
          if (!inside) context.report({ node: call, messageId: 'standalone' })
        }
      },
    }
  },
})
