import { defineRule } from '@oxlint/plugins'
import { astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import {
  schemasElementDefaults,
  schemasElementOptionsSchema,
  schemasElements,
  schemasIsAllowedElement,
} from '../../utils/schemas.utils.ts'
import type { SchemasElementOptions } from '../../types/schemas.types.ts'

export const schemasInline = defineRule({
  meta: {
    type: 'problem',
    schema: [schemasElementOptionsSchema],
    defaultOptions: [
      {
        ...schemasElementDefaults,
        structural: ['array', 'discriminatedUnion', 'intersection', 'lazy', 'object', 'record', 'tuple', 'union'],
      },
    ],
    messages: { inline: '{{namespace}}.{{method}}() elements must use named schemas.' },
  },
  createOnce(context) {
    let methods: string[] = []
    let scalars = true
    let namespaces = new Set<string>()
    let structuralMethods = new Set<string>()

    return {
      before() {
        const options = optionsFirst<SchemasElementOptions>(context)
        methods = options.methods
        scalars = options.scalars
        namespaces = new Set(options.namespaces)
        structuralMethods = new Set(options.structural)
      },
      CallExpression(node) {
        const callee = node.callee

        if (callee.type !== 'MemberExpression' || callee.object.type !== 'Identifier' || !namespaces.has(callee.object.name)) {
          return
        }

        const method = astMemberName(callee)

        if (!method || !methods.includes(method)) {
          return
        }

        for (const element of schemasElements(node)) {
          if (!schemasIsAllowedElement(element, scalars, namespaces, structuralMethods)) {
            context.report({
              node: element,
              messageId: 'inline',
              data: { namespace: callee.object.name, method },
            })
          }
        }
      },
    }
  },
})
