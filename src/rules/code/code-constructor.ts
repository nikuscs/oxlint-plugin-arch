import { defineRule } from '@oxlint/plugins'
import { astDottedName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { CodeConstructorOptions } from '../../types/code.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const codeConstructor = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          constructors: {
            type: 'array',
            items: {
              anyOf: [
                { type: 'string' },
                {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    name: { type: 'string' },
                    message: { type: 'string' },
                  },
                  required: ['name'],
                },
              ],
            },
          },
          checkCalls: { type: 'boolean', default: false },
          message: { type: 'string' },
        },
        required: ['constructors'],
      },
    ],
    messages: {
      construct: "Do not construct '{{name}}'.{{suffix}}",
      call: "Do not call '{{name}}'.{{suffix}}",
    },
  },
  createOnce(context) {
    let entries = new Map<string, string | undefined>()
    let checkCalls = false
    let fallbackMessage: string | undefined

    function report(node: ESTree.NewExpression | ESTree.CallExpression, messageId: 'construct' | 'call') {
      const name = astDottedName(node.callee)

      if (!name || !entries.has(name)) {
        return
      }

      const extra = entries.get(name) ?? fallbackMessage
      context.report({
        node,
        messageId,
        data: { name, suffix: extra ? ` ${extra}` : '' },
      })
    }

    return {
      before() {
        const options = optionsFirst<CodeConstructorOptions>(context)
        entries = new Map()

        for (const item of options.constructors) {
          const [name, message] = typeof item === 'string' ? [item, undefined] : [item.name, item.message]

          if (!entries.has(name)) {
            entries.set(name, message)
          }
        }

        checkCalls = options.checkCalls === true
        fallbackMessage = options.message
        if (entries.size === 0) {
          return false
        }
      },
      NewExpression(node) {
        report(node, 'construct')
      },
      CallExpression(node) {
        if (checkCalls) {
          report(node, 'call')
        }
      },
    }
  },
})
