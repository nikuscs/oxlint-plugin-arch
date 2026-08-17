import { defineRule } from '@oxlint/plugins'
import {
  astStaticMemberName,
  optionsFirst,
  sanitizersCallsConfigured,
  sanitizersConfiguredBindings,
} from '../utils/index.ts'

interface NoUnescapedLikeOptions {
  methods: string[]
  sanitizers: string[]
  allowSanitizedBindings?: boolean
}

/**
 * Requires values passed to configured member methods to use a configured sanitizer call or sanitized binding.
 *
 * Example: `query.ilike(column, escape(term))` passes; passing `term` directly fails.
 */
export const noUnescapedLike = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        methods: { type: 'array', items: { type: 'string' } },
        sanitizers: { type: 'array', items: { type: 'string' } },
        allowSanitizedBindings: { type: 'boolean' },
      },
      required: ['methods', 'sanitizers'],
    }],
    messages: { unescaped: '.{{method}}() values must use a configured sanitizer.' },
  },
  createOnce(context) {
    let sanitized = new Set<string>()
    return {
      Program(program) {
        const { sanitizers, allowSanitizedBindings = true } = optionsFirst<NoUnescapedLikeOptions>(context)
        sanitized = allowSanitizedBindings ? sanitizersConfiguredBindings(program, new Set(sanitizers)) : new Set()
      },
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return
        }

        const { methods, sanitizers } = optionsFirst<NoUnescapedLikeOptions>(context)
        const method = astStaticMemberName(node.callee)

        if (!method || !methods.includes(method)) {
          return
        }

        const value = node.arguments.at(-1)
        const allowedIdentifier = value?.type === 'Identifier' && sanitized.has(value.name)

        if (!sanitizersCallsConfigured(value, new Set(sanitizers)) && !allowedIdentifier) {
          context.report({
            node: value ?? node,
            messageId: 'unescaped',
            data: { method },
          })
        }
      },
    }
  },
})
