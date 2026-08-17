import { defineRule } from '@oxlint/plugins'
import { exportsCollect, namingCamelCase, namingFileBasename, namingPascalCase, optionsFirst } from '../utils/index.ts'

interface NoExtraExportsOptions {
  names: string[]
  domainStem?: 'before-first-dot' | 'full-basename'
  allowTypeExports?: boolean
}

/**
 * Allows only the configured export-name templates, with placeholders derived from the filename.
 *
 * Example: `billing.service.ts` may allow `makeBillingService`; an exported `helper` then fails.
 */
export const noExtraExports = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        names: { type: 'array', items: { type: 'string' } },
        domainStem: { type: 'string', enum: ['before-first-dot', 'full-basename'] },
        allowTypeExports: { type: 'boolean' },
      },
      required: ['names'],
    }],
    messages: {
      extraExport: "Export '{{name}}' is not allowed; expected one of: {{allowed}}.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const options = optionsFirst<NoExtraExportsOptions>(context)
        const basename = namingFileBasename(context.filename).replace(/\.(tsx?|jsx?)$/, '')
        const domain = options.domainStem === 'full-basename' ? basename : (basename.split('.')[0] ?? '')
        const allowed = options.names.map((template) => template
          .replaceAll('{Domain}', namingPascalCase(domain))
          .replaceAll('{domain}', namingCamelCase(domain)))

        for (const binding of exportsCollect(program)) {
          if (options.allowTypeExports && binding.typeOnly) {
            continue
          }

          const name = binding.localName ?? binding.exportedName

          if (!allowed.includes(name)) {
            context.report({
              node: binding.node,
              messageId: 'extraExport',
              data: { name, allowed: allowed.join(', ') },
            })
          }
        }
      },
    }
  },
})
