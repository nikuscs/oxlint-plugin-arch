import { defineRule } from '@oxlint/plugins'
import { exportsCollect } from '../../utils/exports.utils.ts'
import { namingBasename, namingCamelCase, namingFileStem, namingPascalCase, namingStemModes } from '../../utils/naming.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { FilesExportsOptions } from '../../types/files.types.ts'

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const filesExports = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          names: { type: 'array', items: { type: 'string' } },
          patterns: { type: 'array', items: { type: 'string' } },
          domainStem: { type: 'string', enum: [...namingStemModes] },
          trailingRoles: { type: 'array', items: { type: 'string' } },
          roleSeparators: { type: 'array', items: { type: 'string' } },
          allowTypeExports: { type: 'boolean' },
        },
        required: ['names'],
      },
    ],
    messages: {
      extraExport: "Export '{{name}}' is not allowed; expected one of: {{allowed}}.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const options = optionsFirst<FilesExportsOptions>(context)
        const basename = namingBasename(context.filename).replace(/\.(tsx?|jsx?)$/, '')
        const domain = namingFileStem(basename, options.domainStem, options.trailingRoles, options.roleSeparators)
        const pascalDomain = namingPascalCase(domain)
        const camelDomain = namingCamelCase(domain)
        const allowed = options.names.map((template) => template.replaceAll('{Domain}', pascalDomain).replaceAll('{domain}', camelDomain))

        const patterns = (options.patterns ?? []).map((template) => {
          const source = template
            .replaceAll('{Domain}', escapeRegExp(pascalDomain))
            .replaceAll('{domain}', escapeRegExp(camelDomain))

          return new RegExp(`^(?:${source})$`)
        })

        const allowedLabel = [...allowed, ...patterns.map((pattern) => pattern.toString())].join(', ')

        for (const binding of exportsCollect(program)) {
          if (options.allowTypeExports && binding.typeOnly) {
            continue
          }

          const name = binding.localName ?? binding.exportedName

          if (!allowed.includes(name) && !patterns.some((pattern) => pattern.test(name))) {
            context.report({
              node: binding.node,
              messageId: 'extraExport',
              data: { name, allowed: allowedLabel },
            })
          }
        }
      },
    }
  },
})
