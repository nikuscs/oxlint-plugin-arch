import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { astDottedName, optionsFirst } from '../utils/index.ts'

type RestrictedConstructor = string | { name: string; message?: string }

interface NoRestrictedConstructorOptions {
  constructors: RestrictedConstructor[]
  checkCalls?: boolean
  message?: string
}

function restrictedConstructorEntries(constructors: RestrictedConstructor[]): Map<string, string | undefined> {
  const entries = new Map<string, string | undefined>()

  for (const item of constructors) {
    if (typeof item === 'string') {
      if (!entries.has(item)) {
        entries.set(item, undefined)
      }
      continue
    }

    if (!entries.has(item.name)) {
      entries.set(item.name, item.message)
    }
  }

  return entries
}

/**
 * Rejects `new` of configured constructors, and can also reject calling them without `new`.
 *
 * Example: `constructors: ['Error']` allows `throw new DomainError('x')` and rejects `throw new Error('x')`.
 */
export const noRestrictedConstructor = defineRule({
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
        const options = optionsFirst<NoRestrictedConstructorOptions>(context)
        entries = restrictedConstructorEntries(options.constructors)
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
