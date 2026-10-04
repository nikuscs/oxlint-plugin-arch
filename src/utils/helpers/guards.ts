import { trivialUnwrap } from './trivial.ts'
import type { AstRuntimeFunction } from './ast.ts'
import type { ESTree } from '@oxlint/plugins'

interface GuardsState {
  values: Set<string>
  predicates: Set<string>
  primitive: boolean
  returned: boolean
  globalArray: (node: ESTree.Node) => boolean
}

const guardsPrimitiveNames = new Set(['string', 'number', 'boolean', 'object', 'undefined', 'bigint', 'symbol', 'function'])

function guardsValue(node: ESTree.Expression, state: GuardsState): boolean {
  const value = trivialUnwrap(node)
  if (value.type === 'Identifier') return state.values.has(value.name)
  return value.type === 'MemberExpression' && value.computed
    && value.object.type === 'Identifier' && state.values.has(value.object.name)
    && value.property.type === 'Identifier' && state.values.has(value.property.name)
}

function guardsFallback(node: ESTree.Expression): boolean {
  return node.type === 'Literal' && !('regex' in node)
    || node.type === 'Identifier' && node.name === 'undefined'
    || node.type === 'ArrayExpression' && node.elements.length === 0
    || node.type === 'ObjectExpression' && node.properties.length === 0
}

function guardsPredicate(expression: ESTree.Expression, state: GuardsState): boolean {
  const node = trivialUnwrap(expression)
  if (node.type === 'Identifier') return state.predicates.has(node.name)
  if (node.type === 'UnaryExpression' && node.operator === '!') return guardsPredicate(node.argument, state)
  if (node.type === 'LogicalExpression' && (node.operator === '&&' || node.operator === '||')) {
    return guardsPredicate(node.left, state) && guardsPredicate(node.right, state)
  }
  if (node.type === 'BinaryExpression' && ['===', '!==', '==', '!='].includes(node.operator)) {
    for (const [left, right] of [[node.left, node.right], [node.right, node.left]]) {
      if (left.type === 'UnaryExpression' && left.operator === 'typeof'
        && right.type === 'Literal' && typeof right.value === 'string' && guardsPrimitiveNames.has(right.value)
        && guardsValue(left.argument, state)) {
        state.primitive = true
        return true
      }
      if (left.type !== 'PrivateIdentifier' && guardsValue(left, state)
        && (right.type === 'Literal' && right.value === null || right.type === 'Identifier' && right.name === 'undefined')) return true
    }
  }
  if (node.type === 'CallExpression' && !node.optional && node.arguments.length === 1
    && node.arguments[0].type !== 'SpreadElement' && guardsValue(node.arguments[0], state)
    && node.callee.type === 'MemberExpression' && !node.callee.computed && !node.callee.optional
    && node.callee.object.type === 'Identifier' && node.callee.object.name === 'Array'
    && node.callee.property.type === 'Identifier' && node.callee.property.name === 'isArray'
    && state.globalArray(node.callee.object)) {
    state.primitive = true
    return true
  }
  return false
}

function guardsResult(node: ESTree.Expression, state: GuardsState): boolean {
  const value = trivialUnwrap(node)
  if (guardsValue(value, state) || guardsFallback(value) || guardsPredicate(value, state)) return true
  return value.type === 'ConditionalExpression' && guardsPredicate(value.test, state)
    && guardsResult(value.consequent, state) && guardsResult(value.alternate, state)
}

function guardsStatement(node: ESTree.Statement, state: GuardsState): boolean {
  if (node.type === 'EmptyStatement' || node.type === 'ExpressionStatement' && Boolean(node.directive)) return true
  if (node.type === 'ReturnStatement' && node.argument) {
    state.returned = true
    return guardsResult(node.argument, state)
  }
  if (node.type === 'BlockStatement') return node.body.every((statement) => guardsStatement(statement, state))
  if (node.type === 'IfStatement') {
    return guardsPredicate(node.test, state) && guardsStatement(node.consequent, state)
      && (!node.alternate || guardsStatement(node.alternate, state))
  }
  if (node.type === 'VariableDeclaration' && node.kind === 'const') {
    return node.declarations.every((declaration) => {
      if (declaration.id.type !== 'Identifier' || !declaration.init) return false
      if (guardsValue(declaration.init, state)) {
        state.values.add(declaration.id.name)
        return true
      }
      if (guardsPredicate(declaration.init, state)) {
        state.predicates.add(declaration.id.name)
        return true
      }
      return guardsFallback(declaration.init)
    })
  }
  return false
}

export function guardsIsGenericHelper(node: AstRuntimeFunction, globalArray: GuardsState['globalArray']): boolean {
  if (!node.body || node.params.length === 0 || node.params.some((param) => param.type !== 'Identifier')) return false
  const state: GuardsState = {
    values: new Set(node.params.flatMap((param) => param.type === 'Identifier' ? [param.name] : [])),
    predicates: new Set(),
    primitive: false,
    returned: false,
    globalArray,
  }
  if (node.body.type !== 'BlockStatement') return guardsResult(node.body, state) && state.primitive
  return node.body.body.every((statement) => guardsStatement(statement, state)) && state.primitive && state.returned
}
