import type { ESTree, SourceCode } from '@oxlint/plugins'
import type { AstRuntimeFunction } from './ast.ts'
import type { TestRegistration, TestTableRow } from '../../types/test-analysis.types.ts'
import { astDottedName } from './ast.ts'
import { trivialUnwrap } from './trivial.ts'

export function testTablesRegistration(
  call: ESTree.CallExpression,
  names: string[],
  functions: Map<ESTree.Node, AstRuntimeFunction>,
): TestRegistration | undefined {
  let callee = call.callee
  let table: ESTree.Expression | undefined
  if (callee.type === 'CallExpression') {
    const builder = astDottedName(callee.callee)
    if (builder?.endsWith('.for') || builder?.endsWith('.each')) {
      const argument = callee.arguments[0]
      if (argument && argument.type !== 'SpreadElement') table = argument
    }
    callee = callee.callee
  }
  if (callee.type === 'TaggedTemplateExpression') callee = callee.tag
  const name = astDottedName(callee)
  if (
    !name ||
    !names.some(
      (test) =>
        name === test ||
        (name.startsWith(test + '.') &&
          name
            .slice(test.length + 1)
            .split('.')
            .every((part) => ['for', 'each', 'concurrent', 'sequential', 'only', 'skip'].includes(part))),
    )
  )
    return
  const argument = call.arguments.at(-1)
  const callback = argument?.type === 'Identifier' ? functions.get(argument) : argument
  if (
    callback?.type === 'FunctionDeclaration' ||
    callback?.type === 'FunctionExpression' ||
    callback?.type === 'ArrowFunctionExpression'
  ) {
    return { call, callback, table }
  }
}

export function testTablesResolve(
  expression: ESTree.Expression,
  values: Map<ESTree.Node, ESTree.Expression>,
): ESTree.Expression {
  const seen = new Set<ESTree.Node>()
  let value = trivialUnwrap(expression)
  while (values.has(value) && !seen.has(value)) {
    seen.add(value)
    value = trivialUnwrap(values.get(value)!)
  }
  return value
}

export function testTablesRows(
  registration: TestRegistration,
  sourceCode: SourceCode,
  values: Map<ESTree.Node, ESTree.Expression>,
  functions: Map<ESTree.Node, AstRuntimeFunction>,
): TestTableRow[] | undefined {
  if (!registration.table) return
  const table = testTablesResolve(registration.table, values)
  if (table.type !== 'ArrayExpression') return
  const parameter = registration.callback.params[0]
  const variables = sourceCode.getDeclaredVariables(registration.callback)
  return table.elements.map((element) => {
    const row: TestTableRow = { bindings: new Map(), callbacks: [] }
    if (!element || element.type === 'SpreadElement') return row
    const value = testTablesResolve(element, values)
    if (
      value.type !== 'ObjectExpression' ||
      value.properties.some((property) => property.type === 'SpreadElement' || property.computed)
    )
      return row
    const properties = new Map<string, AstRuntimeFunction>()
    for (const property of value.properties) {
      if (property.type !== 'Property' || property.kind !== 'init') continue
      const key =
        property.key.type === 'Identifier'
          ? property.key.name
          : property.key.type === 'Literal'
            ? String(property.key.value)
            : undefined
      if (!key) continue
      properties.delete(key)
      const expression = property.value
      const fn = functions.get(expression) ?? expression
      if (
        fn.type === 'FunctionDeclaration' ||
        fn.type === 'FunctionExpression' ||
        fn.type === 'ArrowFunctionExpression'
      )
        properties.set(key, fn)
    }
    row.callbacks.push(...properties.values())
    if (parameter?.type === 'ObjectPattern') {
      for (const property of parameter.properties) {
        if (property.type !== 'Property' || property.computed || property.value.type !== 'Identifier')
          continue
        const key =
          property.key.type === 'Identifier'
            ? property.key.name
            : property.key.type === 'Literal'
              ? String(property.key.value)
              : ''
        const fn = properties.get(key)
        if (!fn) continue
        const variable = variables.find((entry) =>
          entry.identifiers.some((identifier) => identifier === property.value),
        )
        for (const reference of variable?.references ?? []) row.bindings.set(reference.identifier, fn)
      }
    } else if (parameter?.type === 'Identifier') {
      const variable = variables.find((entry) => entry.identifiers.includes(parameter))
      for (const reference of variable?.references ?? []) {
        const member = reference.identifier.parent
        if (
          member.type !== 'MemberExpression' ||
          member.object !== reference.identifier ||
          member.computed ||
          member.property.type !== 'Identifier'
        )
          continue
        const fn = properties.get(member.property.name)
        if (fn) row.bindings.set(member, fn)
      }
    }
    return row
  })
}

export function testTablesCallName(node: ESTree.Node): string | undefined {
  if (node.type === 'CallExpression') return testTablesCallName(node.callee)
  if (node.type === 'Identifier') return node.name
  if (node.type !== 'MemberExpression' || node.computed || node.property.type !== 'Identifier') return
  const parent = testTablesCallName(node.object)
  return parent ? `${parent}.${node.property.name}` : undefined
}

export function testTablesAssertionPattern(name: string): RegExp {
  const parts = name.split('.')
  const pattern = parts
    .map((part, index) => {
      if (part === '**') return '(?:\\.[^.]+)*'
      return (index ? '\\.' : '') + part.replaceAll('$', '\\$').replaceAll('*', '[^.]*')
    })
    .join('')
  return new RegExp(`^${pattern}$`)
}
