import { defineRule } from '@oxlint/plugins'
import { astDottedName, astIsInlineFunction } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { ReactEmptyEffectOptions } from '../../types/react.types.ts'

export const reactEmptyEffect = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { hooks: { type: 'array', items: { type: 'string' } }, message: { type: 'string' } },
      },
    ],
    messages: { forbidden: '{{message}}' },
  },
  createOnce(context) {
    let hooks = new Set<string>()
    let message = ''

    return {
      before() {
        const options = optionsFirst<ReactEmptyEffectOptions>(context, {})
        hooks = new Set(options.hooks ?? ['useEffect', 'useLayoutEffect', 'React.useEffect', 'React.useLayoutEffect'])
        message = options.message ?? 'Remove the empty effect.'
      },
      CallExpression(node) {
        if (!hooks.has(astDottedName(node.callee) ?? '')) {
          return
        }

        for (const argument of node.arguments) {
          if (astIsInlineFunction(argument) && argument.body?.type === 'BlockStatement' && argument.body.body.length === 0) {
            context.report({
              node: argument.body,
              messageId: 'forbidden',
              data: { message },
            })
          }
        }
      },
    }
  },
})
