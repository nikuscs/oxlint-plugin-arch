import { defineRule } from '@oxlint/plugins'
import {
  astStaticMemberName,
  optionsFirst,
  schemasElements,
  schemasIsAllowedElement,
  schemasIsCall,
} from '../utils/index.ts'

interface NoInlineSchemaElementsOptions {
  namespaces: string[]
  methods: string[]
  structuralMethods: string[]
  allowZodScalars: boolean
}

/**
 * Requires configured schema combinators to reference named schemas instead of defining structural schemas inline.
 *
 * Example: `z.array(userSchema)` passes; `z.array(z.object({ id: z.string() }))` fails.
 */
export const noInlineSchemaElements = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        namespaces: { type: 'array', items: { type: 'string' } },
        methods: { type: 'array', items: { type: 'string' } },
        structuralMethods: { type: 'array', items: { type: 'string' } },
        allowZodScalars: { type: 'boolean' },
      },
    }],
    defaultOptions: [{
      namespaces: ['z'],
      methods: ['array', 'union', 'record', 'tuple'],
      structuralMethods: ['array', 'discriminatedUnion', 'intersection', 'lazy', 'object', 'record', 'tuple', 'union'],
      allowZodScalars: true,
    }],
    messages: { inline: 'z.{{method}}() elements must use named schemas.' },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return
        }

        const options = optionsFirst<NoInlineSchemaElementsOptions>(context)
        const namespaces = new Set(options.namespaces)
        const method = astStaticMemberName(node.callee)

        if (!schemasIsCall(node, namespaces) || !method || !options.methods.includes(method)) {
          return
        }

        for (const element of schemasElements(node)) {
          if (!schemasIsAllowedElement(element, options.allowZodScalars, namespaces, new Set(options.structuralMethods))) {
            context.report({
              node: element,
              messageId: 'inline',
              data: { method },
            })
          }
        }
      },
    }
  },
})
