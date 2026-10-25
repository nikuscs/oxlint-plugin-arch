import { defineRule } from '@oxlint/plugins'
import { astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { BackendOrpcOutputOptions } from '../../types/backend.types.ts'
import type { ESTree } from '@oxlint/plugins'

function backendFindChainCall(expression: ESTree.Expression, method: string): ESTree.CallExpression | undefined {
  if (expression.type === 'ChainExpression') {
    return backendFindChainCall(expression.expression, method)
  }

  if (expression.type === 'MemberExpression') {
    return backendFindChainCall(expression.object, method)
  }

  if (expression.type !== 'CallExpression' || expression.callee.type !== 'MemberExpression') {
    return undefined
  }

  return astMemberName(expression.callee) === method ? expression : backendFindChainCall(expression.callee.object, method)
}

export const backendOrpcOutput = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          composers: { type: 'array', items: { type: 'string' } },
          handler: { type: 'string' },
          output: { type: 'string' },
        },
        required: ['composers'],
      },
    ],
    messages: {
      missing: 'oRPC procedures must declare .output() before .handler().',
      invalid: 'oRPC .output() must use a named schema or configured composer with a named schema.',
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return
        }

        const { composers, handler: handlerMethod = 'handler', output: outputMethod = 'output' } = optionsFirst<BackendOrpcOutputOptions>(context)

        if (astMemberName(node.callee) !== handlerMethod) {
          return
        }

        const output = backendFindChainCall(node.callee.object, outputMethod)

        if (!output) {
          context.report({ node, messageId: 'missing' })
          return
        }

        const schema = output.arguments.at(0)

        const named =
          schema?.type === 'Identifier' ||
          (schema?.type === 'CallExpression' &&
            schema.callee.type === 'Identifier' &&
            composers.includes(schema.callee.name) &&
            schema.arguments[0]?.type === 'Identifier')

        if (!named) {
          context.report({ node: output, messageId: 'invalid' })
        }
      },
    }
  },
})
