import { defineRule } from '@oxlint/plugins'
import { astDottedName, astMatchesCallee, astUnwrap, astVisit } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { AstFunction } from '../../types/ast.types.ts'
import type * as TestsTypes from '../../types/tests.types.ts'
import type { ESTree, SourceCode, Variable } from '@oxlint/plugins'

const registrationModifiers = new Set(['for', 'each', 'concurrent', 'sequential', 'only', 'skip'])

const assertionFunctions = [
  'expect',
  'expect.poll',
  'expect.soft',
  'expect.assert',
  'expect.assertions',
  'expect.hasAssertions',
  'expectTypeOf',
  'assert',
  'assertType',
]

const nativePackages = ['vitest', '@jest/globals', '@playwright/test']

const declarationTypes = new Set([
  'VariableDeclarator',
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'ImportDeclaration',
])

function isFunction(node: ESTree.Node | null | undefined): node is AstFunction {
  return (
    node?.type === 'FunctionDeclaration' ||
    node?.type === 'FunctionExpression' ||
    node?.type === 'ArrowFunctionExpression'
  )
}

function references(variables: Variable[], identifier: ESTree.Node): Variable['references'] {
  return variables.find((entry) => entry.identifiers.some((candidate) => candidate === identifier))?.references ?? []
}

function resolveValue(
  expression: ESTree.Expression,
  values: TestsTypes.TestsAssertionsState['values'],
): ESTree.Expression {
  const seen = new Set<ESTree.Node>()
  let value = astUnwrap(expression)

  for (let next = values.get(value); next && !seen.has(value); next = values.get(value)) {
    seen.add(value)
    value = astUnwrap(next)
  }

  return value
}

function callName(node: ESTree.Node): string | undefined {
  if (node.type === 'CallExpression') {
    return callName(node.callee)
  }

  if (node.type === 'Identifier') {
    return node.name
  }

  if (node.type !== 'MemberExpression' || node.computed || node.property.type !== 'Identifier') {
    return undefined
  }

  const parent = callName(node.object)
  return parent ? `${parent}.${node.property.name}` : undefined
}

function assertionName(call: ESTree.CallExpression, state: TestsTypes.TestsAssertionsState): string | undefined {
  let root: ESTree.Node = call.callee

  while (root.type === 'MemberExpression' || root.type === 'CallExpression') {
    root = root.type === 'MemberExpression' ? root.object : root.callee
  }

  if (state.shadowed.has(root)) {
    return undefined
  }

  const name = callName(call.callee)
  const alias = state.aliases.get(root)
  return alias && name && root.type === 'Identifier' ? alias + name.slice(root.name.length) : name
}

function hasAssertion(
  fn: AstFunction,
  bindings: TestsTypes.TestsAssertionsRow['bindings'],
  seen: Set<AstFunction>,
  state: TestsTypes.TestsAssertionsState,
): boolean {
  if (seen.has(fn)) {
    return false
  }
  seen.add(fn)
  let found = false
  astVisit(fn.body, [], (node, ancestors) => {
    const detached = ancestors.some(
      (ancestor) =>
        ancestor.type === 'FunctionDeclaration' ||
        ((ancestor.type === 'FunctionExpression' || ancestor.type === 'ArrowFunctionExpression') && ancestor.parent.type !== 'CallExpression'),
    )

    if (found || node.type !== 'CallExpression' || detached) {
      return
    }

    const name = assertionName(node, state)

    if (name && state.patterns.some((pattern) => pattern.test(name))) {
      found = true
      return
    }

    const helper = bindings.get(node.callee) ?? state.functions.get(node.callee)

    if (helper) {
      found = hasAssertion(helper, bindings, seen, state)
    }
  })

  return found
}

function propertyKey(key: ESTree.PropertyKey): string | undefined {
  if (key.type === 'Identifier') {
    return key.name
  }
  return key.type === 'Literal' ? String(key.value) : undefined
}

function testRegistration(
  call: ESTree.CallExpression,
  state: TestsTypes.TestsAssertionsState,
): TestsTypes.TestsAssertionsRegistration | undefined {
  let callee = call.callee
  let table: ESTree.Expression | undefined

  if (callee.type === 'CallExpression') {
    const builder = astDottedName(callee.callee)
    const argument = callee.arguments.at(0)

    if ((builder?.endsWith('.for') || builder?.endsWith('.each')) && argument && argument.type !== 'SpreadElement') {
      table = argument
    }
    callee = callee.callee
  }

  if (callee.type === 'TaggedTemplateExpression') {
    callee = callee.tag
  }

  const name = astDottedName(callee)

  if (!astMatchesCallee(name, state.tests, registrationModifiers)) {
    return undefined
  }

  const argument = call.arguments.at(-1)
  const callback = argument?.type === 'Identifier' ? state.functions.get(argument) : argument
  return isFunction(callback) ? { call, callback, table } : undefined
}

function isAssertedTest(
  registration: TestsTypes.TestsAssertionsRegistration,
  sourceCode: SourceCode,
  state: TestsTypes.TestsAssertionsState,
): boolean {
  const { call, callback } = registration
  const builder = call.callee.type === 'CallExpression' ? callName(call.callee.callee) : undefined
  const fixtureParameter = builder?.endsWith('.each') ? undefined : callback.params.at(builder?.endsWith('.for') ? 1 : 0)
  const variables = sourceCode.getDeclaredVariables(callback)

  if (fixtureParameter?.type === 'ObjectPattern') {
    for (const property of fixtureParameter.properties) {
      if (property.type !== 'Property' || property.computed || property.key.type !== 'Identifier') {
        continue
      }

      if (property.key.name !== 'expect' || property.value.type !== 'Identifier') {
        continue
      }

      for (const reference of references(variables, property.value)) {
        state.shadowed.delete(reference.identifier)
        state.aliases.set(reference.identifier, 'expect')
      }
    }
  }

  const table = registration.table ? resolveValue(registration.table, state.values) : undefined

  if (table?.type !== 'ArrayExpression') {
    return hasAssertion(callback, new Map(), new Set(), state)
  }

  const parameter = callback.params.at(0)

  const rows = table.elements.map((element): TestsTypes.TestsAssertionsRow => {
    const value = element && element.type !== 'SpreadElement' ? resolveValue(element, state.values) : undefined

    if (value?.type !== 'ObjectExpression' || value.properties.some((property) => property.type === 'SpreadElement' || property.computed)) {
      return { bindings: new Map(), callbacks: [] }
    }

    const properties = new Map<string, AstFunction>()

    for (const property of value.properties) {
      const key = property.type === 'Property' && property.kind === 'init' ? propertyKey(property.key) : undefined

      if (property.type !== 'Property' || !key) {
        continue
      }
      properties.delete(key)
      const fn = state.functions.get(property.value) ?? property.value

      if (isFunction(fn)) {
        properties.set(key, fn)
      }
    }

    const bindings: TestsTypes.TestsAssertionsRow['bindings'] = new Map()

    if (parameter?.type === 'ObjectPattern') {
      for (const property of parameter.properties) {
        if (property.type !== 'Property' || property.computed || property.value.type !== 'Identifier') {
          continue
        }

        const key = propertyKey(property.key)
        const fn = key === undefined ? undefined : properties.get(key)

        if (!fn) {
          continue
        }

        for (const reference of references(variables, property.value)) {
          bindings.set(reference.identifier, fn)
        }
      }
    } else if (parameter?.type === 'Identifier') {
      for (const reference of references(variables, parameter)) {
        const member = reference.identifier.parent

        if (member.type !== 'MemberExpression' || member.object !== reference.identifier || member.computed) {
          continue
        }

        if (member.property.type !== 'Identifier') {
          continue
        }

        const fn = properties.get(member.property.name)

        if (fn) {
          bindings.set(member, fn)
        }
      }
    }

    return { bindings, callbacks: [...properties.values()] }
  })

  for (const row of rows) {
    for (const rowCallback of row.callbacks) {
      state.allowed.add(rowCallback)
    }
  }

  return rows.length > 0 && rows.every((row) => hasAssertion(callback, row.bindings, new Set(), state))
}

export const testsAssertions = defineRule({
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
      missing: 'This test has no recognized assertion in every case. Assert the result directly or call its assertion helper. Register imported assertion helpers only after verifying that they fail on incorrect results.',
      standalone: 'Put this assertion inside a test or an assertion helper. Table-row assertion callbacks must belong to a registered test.',
    },
  },
  createOnce(context) {
    return {
      'Program:exit'(program) {
        const { sourceCode } = context

        const options = optionsFirst<TestsTypes.TestsAssertionsOptions>(context, {})
        const additional = options.additionalAssertionFunctions ?? []

        const state: TestsTypes.TestsAssertionsState = {
          tests: ['test', 'it', ...(options.additionalTestFunctions ?? [])],
          patterns: [...assertionFunctions, 'assert.*', ...additional].map((name) => {
            const pattern = name
              .split('.')
              .map((part, index) => {
                if (part === '**') {
                  return '(?:\\.[^.]+)*'
                }
                return (index ? '\\.' : '') + part.replaceAll('$', '\\$').replaceAll('*', '[^.]*')
              })
              .join('')

            return new RegExp(`^${pattern}$`)
          }),
          assertionRoots: new Set([...assertionFunctions, ...additional].map((name) => name.split('.')[0])),
          functions: new Map(),
          values: new Map(),
          aliases: new Map(),
          shadowed: new Set(),
          calls: [],
          allowed: new Set(),
        }

        astVisit(program, [], (node) => {
          if (node.type === 'CallExpression') {
            state.calls.push(node)
          }

          if (!declarationTypes.has(node.type)) {
            return
          }

          for (const variable of sourceCode.getDeclaredVariables(node)) {
            if (node.type === 'ImportDeclaration') {
              const specifier = node.specifiers.find((entry) => entry.local.name === variable.name)

              if (!nativePackages.includes(node.source.value) || specifier?.type !== 'ImportSpecifier') {
                continue
              }

              const imported = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value

              if (imported === 'test' || imported === 'it') {
                state.tests.push(variable.name)
              }

              for (const reference of state.assertionRoots.has(imported) ? variable.references : []) {
                state.aliases.set(reference.identifier, imported)
              }
              continue
            }

            for (const reference of state.assertionRoots.has(variable.name) ? variable.references : []) {
              state.shadowed.add(reference.identifier)
            }

            const declaredFunction = node.type === 'FunctionDeclaration' ? node : undefined
            const fn = node.type === 'VariableDeclarator' ? node.init : declaredFunction

            if (isFunction(fn)) {
              for (const reference of variable.references) {
                state.functions.set(reference.identifier, fn)
              }
              state.allowed.add(fn)
            }

            if (node.type === 'VariableDeclarator' && node.init && node.parent.type === 'VariableDeclaration' && node.parent.kind === 'const') {
              for (const reference of variable.references) {
                state.values.set(reference.identifier, node.init)
              }
            }
          }
        })

        for (const call of state.calls) {
          const fixtureName = callName(call.callee)
          const fixtureArgument = call.arguments.at(0)

          const fixtures =
            fixtureArgument && fixtureArgument.type !== 'SpreadElement' && state.tests.some((test) => fixtureName === `${test}.extend`)
              ? resolveValue(fixtureArgument, state.values)
              : undefined

          for (const property of fixtures?.type === 'ObjectExpression' ? fixtures.properties : []) {
            if (property.type !== 'Property') {
              continue
            }

            const [first] = property.value.type === 'ArrayExpression' ? property.value.elements : []
            const value = first ?? property.value
            const fn = state.functions.get(value) ?? value

            if (isFunction(fn)) {
              state.allowed.add(fn)
            }
          }

          const registration = testRegistration(call, state)

          if (!registration) {
            continue
          }
          state.allowed.add(registration.callback)
          if (!isAssertedTest(registration, sourceCode, state)) {
            context.report({ node: call, messageId: 'missing' })
          }
        }

        for (const call of state.calls) {
          const name = assertionName(call, state)

          if (!name || !assertionFunctions.includes(name) || !name.startsWith('expect')) {
            continue
          }

          let parent: ESTree.Node = call.parent

          while (parent.type !== 'Program' && !(isFunction(parent) && state.allowed.has(parent))) {
            parent = parent.parent
          }

          if (parent.type === 'Program') {
            context.report({ node: call, messageId: 'standalone' })
          }
        }
      },
    }
  },
})
