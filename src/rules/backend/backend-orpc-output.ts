import { defineRule } from '@oxlint/plugins'
import { astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsMessage } from '../../utils/options.utils.ts'
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

function backendOrpcPath(node: ESTree.Node): string[] | undefined {
  if (node.type === 'Identifier') {
    return [node.name]
  }

  if (node.type === 'CallExpression') {
    return backendOrpcPath(node.callee)
  }

  if (node.type !== 'MemberExpression') {
    return undefined
  }

  const name = astMemberName(node)
  const object = backendOrpcPath(node.object)

  return name === undefined || object === undefined ? undefined : [...object, name]
}

export const backendOrpcOutput = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          handler: { type: 'string' },
          output: { type: 'string' },
          roots: { type: 'array', items: { type: 'string', minLength: 1 }, minItems: 1 },
          require: { type: 'array', items: { type: 'string', minLength: 1 }, minItems: 1 },
          ignore: { type: 'array', items: { type: 'string', minLength: 1 } },
          message: { type: 'string' },
        },
      },
    ],
    messages: {
      missing: 'oRPC procedures must declare .output() before .handler().{{message}}',
      invalid: 'oRPC .output() must use a named schema or a plain function called with a named schema.{{message}}',
      required: 'This procedure must call .{{method}}().{{message}}',
    },
  },
  createOnce(context) {
    let options: BackendOrpcOutputOptions = {}
    let roots: string[][] = []
    let message = ''

    function checkContract(node: ESTree.CallExpression): void {
      const parent = node.parent.type === 'ChainExpression' ? node.parent.parent : node.parent

      if (roots.length === 0 || (parent.type === 'MemberExpression' && (parent.object === node || parent.object === node.parent))) {
        return
      }

      const path = backendOrpcPath(node)
      const root = path && roots.find((parts) => parts.length <= path.length && parts.every((part, index) => path[index] === part))
      const methods = new Set(path?.slice(root?.length))

      if (!root || (options.ignore ?? ['router']).some((name) => methods.has(name))) {
        return
      }

      for (const method of (options.require ?? [options.output ?? 'output']).filter((name) => !methods.has(name))) {
        context.report({
          node,
          messageId: 'required',
          data: { method, message },
        })
      }
    }

    return {
      before() {
        options = optionsFirst<BackendOrpcOutputOptions>(context, {})
        roots = (options.roots ?? []).map((root) => root.split('.'))
        message = optionsMessage(options.message)
      },
      CallExpression(node) {
        checkContract(node)

        if (node.callee.type !== 'MemberExpression') {
          return
        }

        const { handler: handlerMethod = 'handler', output: outputMethod = 'output' } = options

        if (astMemberName(node.callee) !== handlerMethod) {
          return
        }

        const output = backendFindChainCall(node.callee.object, outputMethod)

        if (!output) {
          context.report({
            node,
            messageId: 'missing',
            data: { message },
          })
          return
        }

        const schema = output.arguments.at(0)

        const named =
          schema?.type === 'Identifier' ||
          (schema?.type === 'CallExpression' &&
            schema.callee.type === 'Identifier' &&
            schema.arguments[0]?.type === 'Identifier')

        if (!named) {
          context.report({
            node: output,
            messageId: 'invalid',
            data: { message },
          })
        }
      },
    }
  },
})
