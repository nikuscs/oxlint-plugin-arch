import { defineRule } from '@oxlint/plugins'
import { namingCaptures, namingExpand, namingTemplatePattern } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema } from '../../utils/options.utils.ts'
import type { NamingImportsCompiled, NamingImportsOptions } from '../../types/naming.types.ts'

function namingImportsNames(entry: NamingImportsCompiled, captures: Record<string, string>): string[] {
  const dropped = Object.entries(captures).map(([key, value]) => [key, entry.drop.reduce((text, drop) => text.replace(drop, ''), value)])

  return entry.names.map((template) => namingExpand(template, Object.fromEntries(dropped), true))
}

export const namingImports = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          file: { type: 'string' },
          imports: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                source: { type: 'string' },
                name: { anyOf: [optionsPatternSchema, { type: 'boolean', enum: [false] }] },
                namespace: { type: 'boolean' },
                drop: optionsPatternSchema,
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
    let paths: Record<string, string> = {}

    return {
      before() {
        const options = optionsFirst<NamingImportsOptions>(context, { imports: [] })
        const captures = namingCaptures(context.filename, { file: options.file })

        paths = captures ?? {}

        entries = options.imports.flatMap((entry) => {
          const pattern = namingTemplatePattern(entry.source, entry.placeholder ?? '[^/]+')
          const names = entry.name === false ? [] : [entry.name].flat()

          return pattern ? [{ pattern, names, namespace: entry.namespace !== false, drop: optionsPatterns(entry.drop) }] : []
        })

        if (entries.length === 0 || !captures) {
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

          if (entry.names.length === 0) {
            return
          }

          const names = namingImportsNames(entry, { ...paths, ...match.groups })
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
