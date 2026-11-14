import { defineRule } from '@oxlint/plugins'
import { namingExpand, namingTemplatePattern } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsPatternSchema } from '../../utils/options.utils.ts'
import type { NamingImportsCompiled, NamingImportsOptions } from '../../types/naming.types.ts'

export const namingImports = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          imports: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                source: { type: 'string' },
                name: optionsPatternSchema,
                namespace: { type: 'boolean' },
                placeholder: { type: 'string' },
              },
              required: ['source', 'name'],
            },
          },
        },
        required: ['imports'],
      },
    ],
    messages: {
      name: "Import '{{source}}' as '{{expected}}', not '{{actual}}'.",
      namespace: "Import '{{source}}' as a namespace: import * as {{expected}}.",
    },
  },
  createOnce(context) {
    let entries: NamingImportsCompiled[] = []

    return {
      before() {
        entries = optionsFirst<NamingImportsOptions>(context, { imports: [] }).imports.flatMap((entry) => {
          const pattern = namingTemplatePattern(entry.source, entry.placeholder ?? '[^/]+')

          return pattern ? [{ pattern, names: [entry.name].flat(), namespace: entry.namespace !== false }] : []
        })

        if (entries.length === 0) {
          return false
        }
      },
      ImportDeclaration(node) {
        const source = node.source.value

        for (const entry of entries) {
          const match = entry.pattern.exec(source)

          if (!match) {
            continue
          }

          const names = entry.names.map((template) => namingExpand(template, { ...match.groups }, true))
          const expected = names.join(' or ')

          for (const specifier of node.specifiers) {
            if (specifier.type !== 'ImportNamespaceSpecifier' && entry.namespace) {
              context.report({
                node: specifier,
                messageId: 'namespace',
                data: { source, expected },
              })
            } else if (specifier.type !== 'ImportSpecifier' && !names.includes(specifier.local.name)) {
              context.report({
                node: specifier,
                messageId: 'name',
                data: { source, expected, actual: specifier.local.name },
              })
            }
          }

          return
        }
      },
    }
  },
})
