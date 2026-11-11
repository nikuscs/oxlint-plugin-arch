import { defineRule } from '@oxlint/plugins'
import { astCallName, astDottedName, astIsInlineFunction, astSome } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { CodeDelegateOptions } from '../../types/code.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const codeDelegate = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          methods: { type: 'array', items: { type: 'string' } },
          reads: { type: 'array', items: { type: 'string' } },
          max: { type: 'integer', minimum: 0 },
        },
      },
    ],
    messages: {
      statement: 'A handler only delegates: read services, make one call, return. Move this to an action.',
      calls: "A handler's yielded or awaited calls are limited to {{max}}; move the rest into the action it calls.",
      ternary: 'A handler does not branch; move the condition into the action it calls.',
      nested: 'A handler holds no function; move it into the action it calls.',
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const { methods = ['handler', 'effect'], reads = ['Effect.serviceOption'], max = 1 } = optionsFirst<CodeDelegateOptions>(context, {})

        if (!methods.includes(astCallName(node) ?? '')) {
          return
        }

        const awaited = (value: ESTree.Node | null | undefined) => value?.type === 'YieldExpression' || value?.type === 'AwaitExpression'

        for (const handler of node.arguments.filter(astIsInlineFunction)) {
          let calls = 0

          const scan = (value: ESTree.Node) =>
            astSome(
              value,
              (child) => {
                if (child.type === 'ConditionalExpression') {
                  context.report({ node: child, messageId: 'ternary' })
                }

                if (child.type === 'FunctionDeclaration' || astIsInlineFunction(child)) {
                  context.report({ node: child, messageId: 'nested' })
                }

                const target = awaited(child) && 'argument' in child ? child.argument : null

                if (target?.type === 'CallExpression' && !reads.includes(astDottedName(target.callee) ?? '')) {
                  calls += 1

                  if (calls > max) {
                    context.report({
                      node: child,
                      messageId: 'calls',
                      data: { max: String(max) },
                    })
                  }
                }

                return false
              },
              (child) => child.type !== 'FunctionDeclaration' && !astIsInlineFunction(child),
            )

          const { body } = handler

          if (body && body.type !== 'BlockStatement') {
            scan(body)
          }

          for (const statement of body?.type === 'BlockStatement' ? body.body : []) {
            const allowed =
              statement.type === 'ReturnStatement' ||
              (statement.type === 'VariableDeclaration' && statement.declarations.every((declarator) => awaited(declarator.init))) ||
              (statement.type === 'ExpressionStatement' && awaited(statement.expression) && 'argument' in statement.expression && statement.expression.argument?.type === 'CallExpression')

            if (!allowed) {
              context.report({ node: statement, messageId: 'statement' })
            }

            scan(statement)
          }
        }
      },
    }
  },
})
