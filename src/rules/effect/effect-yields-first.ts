import { defineRule } from '@oxlint/plugins'
import { astDottedName, astMemberName, astUnwrap } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsMessage, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { EffectYieldsFirstOptions } from '../../types/effect.types.ts'
import type { ESTree } from '@oxlint/plugins'

function effectYieldsFirstService(statement: ESTree.Statement, services: RegExp[]): string | undefined {
  const init = statement.type === 'VariableDeclaration' && statement.declarations.length === 1 ? statement.declarations[0].init : null
  const argument = init?.type === 'YieldExpression' && init.delegate ? init.argument : null
  const source = argument?.type === 'MemberExpression' ? astDottedName(argument) : undefined

  if (source === undefined || argument?.type !== 'MemberExpression') {
    return undefined
  }

  return (services.length > 0 ? optionsPatternsTest(services, source) : /^[A-Z]/.test(astMemberName(argument) ?? '')) ? source : undefined
}

function effectYieldsFirstCallee(statement: ESTree.Statement): string | undefined {
  const expression = statement.type === 'ExpressionStatement' ? astUnwrap(statement.expression) : undefined
  const call = expression?.type === 'YieldExpression' && expression.argument ? astUnwrap(expression.argument) : expression

  return call?.type === 'CallExpression' ? astDottedName(call.callee) : undefined
}

export const effectYieldsFirst = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: optionsPatternSchema,
          services: optionsPatternSchema,
          message: { type: 'string' },
        },
      },
    ],
    messages: {
      first: 'Yield {{source}} with the other dependencies, at the top of the function.{{message}}',
    },
  },
  createOnce(context) {
    let allowed: RegExp[] = []
    let services: RegExp[] = []
    let message = ''

    return {
      before() {
        const options = optionsFirst<EffectYieldsFirstOptions>(context, {})

        allowed = optionsPatterns(options.allow)
        services = optionsPatterns(options.services)
        message = optionsMessage(options.message)
      },
      FunctionExpression(node) {
        if (!node.generator || !node.body) {
          return
        }

        let started = false

        for (const statement of node.body.body) {
          const source = effectYieldsFirstService(statement, services)

          if (source === undefined) {
            started ||= !optionsPatternsTest(allowed, effectYieldsFirstCallee(statement) ?? '')
          } else if (started) {
            context.report({
              node: statement,
              messageId: 'first',
              data: { source, message },
            })
          }
        }
      },
    }
  },
})
