import { defineRule } from '@oxlint/plugins'
import { astDottedName, astIsForwarder, astSingleExpression, astUnwrap } from '../../utils/ast.utils.ts'
import { exportsCheckedFunctions } from '../../utils/exports.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { AstFunction } from '../../types/ast.types.ts'
import type { CodeTrivialFunctionsGuardState, CodeTrivialFunctionsOptions } from '../../types/code.types.ts'
import type { ESTree, Scope } from '@oxlint/plugins'

const codeTrivialFunctionsBanned = [
  'isRecord',
  'isPlainObject',
  'isObject',
  'isString',
  'isNumber',
  'isBoolean',
  'isArray',
  'asRecord',
  'asArray',
]

const codeTrivialFunctionsPrimitives = new Set(['string', 'number', 'boolean', 'object', 'undefined', 'bigint', 'symbol', 'function'])

function isTrivialExpression(node: ESTree.Expression): boolean {
  const value = astUnwrap(node)

  if (
    value.type === 'Identifier' ||
    value.type === 'ThisExpression' ||
    value.type === 'MetaProperty' ||
    value.type.endsWith('Literal') ||
    value.type === 'MemberExpression' ||
    value.type === 'CallExpression' ||
    value.type === 'NewExpression' ||
    value.type === 'TaggedTemplateExpression'
  ) {
    return true
  }

  return (
    value.type === 'LogicalExpression' &&
    isTrivialExpression(value.left) &&
    isTrivialExpression(value.right)
  )
}

function isTrivialFunction(node: AstFunction): boolean {
  if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') {
    return isTrivialExpression(node.body)
  }

  if (node.body?.type !== 'BlockStatement') {
    return false
  }

  const statements = node.body.body.filter(
    (statement) =>
      statement.type !== 'EmptyStatement' && !(statement.type === 'ExpressionStatement' && statement.directive),
  )

  if (statements.length === 0) {
    return true
  }

  if (statements.length > 1) {
    return false
  }

  const [statement] = statements

  if (statement.type === 'ReturnStatement') {
    return !statement.argument || isTrivialExpression(statement.argument)
  }

  return statement.type === 'ExpressionStatement' && isTrivialExpression(statement.expression)
}

function guardValue(node: ESTree.Expression, state: CodeTrivialFunctionsGuardState): boolean {
  const value = astUnwrap(node)

  if (value.type === 'Identifier') {
    return state.values.has(value.name)
  }

  return (
    value.type === 'MemberExpression' &&
    value.computed &&
    value.object.type === 'Identifier' &&
    state.values.has(value.object.name) &&
    value.property.type === 'Identifier' &&
    state.values.has(value.property.name)
  )
}

function guardFallback(node: ESTree.Expression): boolean {
  return (
    (node.type === 'Literal' && !('regex' in node)) ||
    (node.type === 'Identifier' && node.name === 'undefined') ||
    (node.type === 'ArrayExpression' && node.elements.length === 0) ||
    (node.type === 'ObjectExpression' && node.properties.length === 0)
  )
}

function guardComparison(node: ESTree.BinaryExpression, state: CodeTrivialFunctionsGuardState): boolean {
  if (!['===', '!==', '==', '!='].includes(node.operator)) {
    return false
  }

  for (const [left, right] of [
    [node.left, node.right],
    [node.right, node.left],
  ]) {
    if (
      left.type === 'UnaryExpression' &&
      left.operator === 'typeof' &&
      right.type === 'Literal' &&
      typeof right.value === 'string' &&
      codeTrivialFunctionsPrimitives.has(right.value) &&
      guardValue(left.argument, state)
    ) {
      state.primitive = true
      return true
    }

    const nullish = (right.type === 'Literal' && right.value === null) || (right.type === 'Identifier' && right.name === 'undefined')

    if (guardValue(left, state) && nullish) {
      return true
    }
  }

  return false
}

function guardPredicate(expression: ESTree.Expression, state: CodeTrivialFunctionsGuardState): boolean {
  const node = astUnwrap(expression)

  if (node.type === 'Identifier') {
    return state.predicates.has(node.name)
  }

  if (node.type === 'UnaryExpression') {
    return node.operator === '!' && guardPredicate(node.argument, state)
  }

  if (node.type === 'LogicalExpression') {
    return node.operator !== '??' && guardPredicate(node.left, state) && guardPredicate(node.right, state)
  }

  if (node.type === 'BinaryExpression') {
    return node.operator !== 'in' && guardComparison(node, state)
  }

  if (node.type !== 'CallExpression') {
    return false
  }

  const [argument] = node.arguments

  const arrayCheck =
    !node.optional &&
    node.arguments.length === 1 &&
    argument.type !== 'SpreadElement' &&
    guardValue(argument, state) &&
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    !node.callee.optional &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'Array' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'isArray' &&
    state.globalArray(node.callee.object)

  if (!arrayCheck) {
    return false
  }

  state.primitive = true

  return true
}

function guardResult(node: ESTree.Expression, state: CodeTrivialFunctionsGuardState): boolean {
  const value = astUnwrap(node)

  if (guardValue(value, state) || guardFallback(value) || guardPredicate(value, state)) {
    return true
  }

  return (
    value.type === 'ConditionalExpression' &&
    guardPredicate(value.test, state) &&
    guardResult(value.consequent, state) &&
    guardResult(value.alternate, state)
  )
}

function guardStatement(node: ESTree.Statement, state: CodeTrivialFunctionsGuardState): boolean {
  if (node.type === 'EmptyStatement' || (node.type === 'ExpressionStatement' && Boolean(node.directive))) {
    return true
  }

  if (node.type === 'ReturnStatement' && node.argument) {
    state.returned = true

    return guardResult(node.argument, state)
  }

  if (node.type === 'BlockStatement') {
    return node.body.every((statement) => guardStatement(statement, state))
  }

  if (node.type === 'IfStatement') {
    return (
      guardPredicate(node.test, state) &&
      guardStatement(node.consequent, state) &&
      (!node.alternate || guardStatement(node.alternate, state))
    )
  }

  return (
    node.type === 'VariableDeclaration' &&
    node.kind === 'const' &&
    node.declarations.every((declaration) => {
      if (declaration.id.type !== 'Identifier' || !declaration.init) {
        return false
      }

      if (guardValue(declaration.init, state)) {
        state.values.add(declaration.id.name)
        return true
      }

      if (guardPredicate(declaration.init, state)) {
        state.predicates.add(declaration.id.name)
        return true
      }

      return guardFallback(declaration.init)
    })
  )
}

export const codeTrivialFunctions = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: optionsPatternSchema,
          callees: { type: 'array', items: { type: 'string' } },
          async: { type: 'boolean' },
          services: { type: 'boolean' },
          mode: { type: 'string', enum: ['legacy', 'precise'] },
          deny: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          guards: { type: 'boolean' },
        },
      },
    ],
    messages: {
      trivial: 'Function {{name}} adds no transformation; inline it or use a value for a constant result. Keep deliberate adapters through an explicit rule exclusion.',
      bannedName: 'Helper {{name}} is forbidden by this policy. Inline the local check, or validate external input at its boundary; renaming the guard does not fix it.',
      genericGuard: 'Helper {{name}} only performs generic runtime type checks or fallback reads. Inline the local check, or validate external input at its boundary; do not add a schema merely to retain this helper.',
    },
  },
  createOnce(context) {
    let allowed: RegExp[] = []
    let allowedCallees: RegExp[] = []
    let allowAsync = false
    let precise = false
    let bannedNames = new Set<string>()
    let checkGenericGuards = false
    let checkServiceMethods = false
    const reported = new Set<number>()
    const checked = new Set<number>()

    function checkHelper(node: AstFunction): void {
      if ((bannedNames.size === 0 && !checkGenericGuards) || checked.has(node.start)) {
        return
      }
      checked.add(node.start)
      const parent = node.parent
      let name = '<anonymous>'

      if (node.type !== 'ArrowFunctionExpression' && node.id) {
        name = node.id.name
      } else if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
        name = parent.id.name
      } else if (parent.type === 'Property' && !parent.computed && parent.key.type === 'Identifier') {
        name = parent.key.name
      }

      if (optionsPatternsTest(allowed, name)) {
        return
      }

      if (bannedNames.has(name)) {
        reported.add(node.start)
        context.report({
          node,
          messageId: 'bannedName',
          data: { name },
        })

        return
      }

      if (!checkGenericGuards || !node.body || node.params.length === 0 || node.params.some((param) => param.type !== 'Identifier')) {
        return
      }

      const state: CodeTrivialFunctionsGuardState = {
        values: new Set(node.params.flatMap((param) => (param.type === 'Identifier' ? [param.name] : []))),
        predicates: new Set(),
        primitive: false,
        returned: false,
        globalArray: (array) => {
          for (let scope: Scope | null = context.sourceCode.getScope(array); scope; scope = scope.upper) {
            const variable = scope.set.get('Array')

            if (variable) {
              return variable.defs.length === 0
            }
          }
          return true
        },
      }

      const genericGuard =
        node.body.type === 'BlockStatement'
          ? node.body.body.every((statement) => guardStatement(statement, state)) && state.primitive && state.returned
          : guardResult(node.body, state) && state.primitive

      if (genericGuard) {
        reported.add(node.start)
        context.report({
          node,
          messageId: 'genericGuard',
          data: { name },
        })
      }
    }

    return {
      before() {
        const options = optionsFirst<CodeTrivialFunctionsOptions>(context, {})
        precise = options.mode === 'precise'
        checkServiceMethods = options.services ?? false
        bannedNames = new Set(options.deny ?? (precise ? codeTrivialFunctionsBanned : []))
        checkGenericGuards = options.guards ?? precise
        allowed = optionsPatterns(options.allow)
        allowedCallees = (options.callees ?? []).map((pattern) => new RegExp(pattern))
        allowAsync = options.async ?? false
        reported.clear()
        checked.clear()
      },
      FunctionDeclaration: checkHelper,
      FunctionExpression: checkHelper,
      ArrowFunctionExpression: checkHelper,
      Program(program) {
        for (const { name, node } of exportsCheckedFunctions(program, true, checkServiceMethods, allowed)) {
          checkHelper(node)
          if (reported.has(node.start) || node.returnType?.typeAnnotation.type === 'TSTypePredicate') {
            continue
          }

          const expression = astSingleExpression(node)
          const trivial = precise && expression ? astIsForwarder(node, expression) : isTrivialFunction(node)
          const value = expression && astUnwrap(expression)
          const path = value?.type === 'CallExpression' ? astDottedName(value.callee) : undefined

          const allowedCall =
            value?.type === 'CallExpression' &&
            ((allowAsync && node.async) || (path !== undefined && allowedCallees.some((pattern) => pattern.test(path))))

          if (!trivial || allowedCall) {
            continue
          }
          reported.add(node.start)
          context.report({
            node,
            messageId: 'trivial',
            data: { name },
          })
        }
      },
    }
  },
})
