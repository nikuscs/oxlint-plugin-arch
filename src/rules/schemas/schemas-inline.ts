import { defineRule } from '@oxlint/plugins'
import { astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import {
  schemasElementDefaults,
  schemasElementOptionsSchema,
  schemasElements,
  schemasIsAllowedElement,
  schemasIsCall,
} from '../../utils/schemas.utils.ts'
import type { SchemasInlineOptions } from '../../types/schemas.types.ts'

export const schemasInline = defineRule({
  meta: {
    type: 'problem',
    schema: [schemasElementOptionsSchema],
    defaultOptions: [
      {
        ...schemasElementDefaults,
        structuralMethods: ['array', 'discriminatedUnion', 'intersection', 'lazy', 'object', 'record', 'tuple', 'union'],
      },
    ],
    messages: { inline: 'z.{{method}}() elements must use named schemas.' },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return
        }

        const options = optionsFirst<SchemasInlineOptions>(context)
        const namespaces = new Set(options.namespaces)
        const method = astMemberName(node.callee)

        if (!schemasIsCall(node, namespaces) || !method || !options.methods.includes(method)) {
          return
        }

        const structuralMethods = new Set(options.structuralMethods)

        for (const element of schemasElements(node)) {
          if (!schemasIsAllowedElement(element, options.allowZodScalars, namespaces, structuralMethods)) {
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
