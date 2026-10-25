import { defineRule } from '@oxlint/plugins'
import { namingBasename, namingPascalCase } from '../../utils/naming.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { TypesNamespaceImportOptions } from '../../types/types.types.ts'

export const typesNamespaceImport = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          max: { type: 'integer', minimum: 0 },
          names: { type: 'object', additionalProperties: { type: 'string', pattern: '^[A-Za-z_$][\\w$]*$' } },
        },
      },
    ],
    defaultOptions: [{ max: 3, names: {} }],
    messages: {
      namespace: "Use `import type * as {{name}} from '{{source}}'` for {{count}} type imports (max {{max}}); keep exported domain names.",
    },
  },
  createOnce(context) {
    return {
      ImportDeclaration(node) {
        const { max, names } = optionsFirst<TypesNamespaceImportOptions>(context)

        if (
          node.specifiers.length <= max ||
          !node.specifiers.every((specifier) => specifier.type === 'ImportSpecifier' && (node.importKind === 'type' || specifier.importKind === 'type'))
        ) {
          return
        }

        const source = node.source.value
        const stem = namingBasename(source).replace(/(?:\.d)?\.[cm]?[jt]sx?$/i, '')
        const pascal = namingPascalCase(stem.replace(/[^A-Za-z0-9_$.-]/g, '-')) || 'Module'
        const prefixed = /^\d/.test(pascal) ? `Module${pascal}` : pascal
        const fallback = prefixed.endsWith('Types') ? prefixed : `${prefixed}Types`
        const name = Object.hasOwn(names, source) ? names[source] : fallback

        context.report({
          node,
          messageId: 'namespace',
          data: { name, source, count: node.specifiers.length, max },
        })
      },
    }
  },
})
