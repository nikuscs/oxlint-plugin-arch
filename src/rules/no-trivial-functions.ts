import { defineRule } from '@oxlint/plugins'
import {
  astDottedName,
  declarationsIsTrivialFunction,
  declarationsTopLevelUnexportedFunctions,
  exportsCollectFunctions,
  optionsFirst,
} from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface NoTrivialFunctionsOptions {
  allowPattern?: string
  allowCallees?: string[]
  allowAsync?: boolean
}

function forwardedExpression(node: ESTree.Function | ESTree.ArrowFunctionExpression): ESTree.Expression | null {
  if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') {
    return node.body
  }

  if (!node.body || node.body.type !== 'BlockStatement') {
    return null
  }

  const statements = node.body.body.filter((statement) => statement.type !== 'EmptyStatement'
    && !(statement.type === 'ExpressionStatement' && statement.directive))
  if (statements.length !== 1) {
    return null
  }

  const statement = statements[0]
  if (statement.type === 'ReturnStatement') {
    return statement.argument
  }

  return statement.type === 'ExpressionStatement' ? statement.expression : null
}

function forwardedCall(expression: ESTree.Expression): ESTree.CallExpression | null {
  if (expression.type === 'ParenthesizedExpression' || expression.type === 'TSAsExpression'
    || expression.type === 'TSSatisfiesExpression' || expression.type === 'TSTypeAssertion'
    || expression.type === 'TSNonNullExpression' || expression.type === 'ChainExpression') {
    return forwardedCall(expression.expression)
  }

  if (expression.type === 'AwaitExpression') {
    return forwardedCall(expression.argument)
  }

  return expression.type === 'CallExpression' ? expression : null
}

/**
 * Rejects top-level functions that are empty or only forward a lookup, identifier, or other call.
 *
 * Example: `export function loadUser(id: string) { return fetchUser(id) }` fails; a function with branching or extra statements passes.
 */
export const noTrivialFunctions = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        allowPattern: { type: 'string' },
        allowCallees: { type: 'array', items: { type: 'string' } },
        allowAsync: { type: 'boolean' },
      },
    }],
    messages: {
      trivial: 'Function {{name}} does nothing useful; inline it at the call site.',
    },
  },
  createOnce(context) {
    let allowed: RegExp | null = null
    let allowedCallees: RegExp[] = []
    let allowAsync = false

    return {
      before() {
        const { allowPattern, allowCallees: calleePatterns = [], allowAsync: asyncAllowed = false }
          = optionsFirst<NoTrivialFunctionsOptions>(context, {})
        allowed = allowPattern ? new RegExp(allowPattern) : null
        allowedCallees = calleePatterns.map((pattern) => new RegExp(pattern))
        allowAsync = asyncAllowed
      },
      Program(program) {
        const seen = new Set<string>()

        for (const item of [...exportsCollectFunctions(program), ...declarationsTopLevelUnexportedFunctions(program)]) {
          const key = `${item.name}:${item.node.start}:${item.node.end}`

          if (seen.has(key) || allowed?.test(item.name) || !declarationsIsTrivialFunction(item.node)) {
            continue
          }

          const expression = forwardedExpression(item.node)
          const call = expression && forwardedCall(expression)
          const path = call && astDottedName(call.callee)
          if (allowAsync && item.node.async && call
            || path && allowedCallees.some((pattern) => pattern.test(path))) {
            continue
          }

          seen.add(key)
          context.report({
            node: item.node,
            messageId: 'trivial',
            data: { name: item.name },
          })
        }
      },
    }
  },
})
