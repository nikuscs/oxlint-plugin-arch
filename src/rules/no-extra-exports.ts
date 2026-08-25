import { defineRule } from '@oxlint/plugins'
import {
  exportsCollect,
  namingCamelCase,
  namingFileBasename,
  namingFileStem,
  namingPascalCase,
  namingStemModes,
  optionsFirst,
} from '../utils/index.ts'

interface NoExtraExportsOptions {
  names: string[]
  domainStem?: 'before-first-dot' | 'full-basename'
  trailingRoles?: string[]
  roleSeparators?: string[]
  allowTypeExports?: boolean
}

/**
 * Allows only the configured export-name templates, with placeholders derived from the filename.
 *
 * Example: `billing.service.ts` may allow `makeBillingService`; an exported `helper` then fails.
 * Example: With `trailingRoles: ['utils']`, `onchain-utils.ts` allows `makeOnchainService` the same way `onchain.utils.ts` does.
 */
export const noExtraExports = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        names: { type: 'array', items: { type: 'string' } },
        domainStem: { type: 'string', enum: [...namingStemModes] },
        trailingRoles: { type: 'array', items: { type: 'string' } },
        roleSeparators: { type: 'array', items: { type: 'string' } },
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
        const domain = namingFileStem(basename, options.domainStem, options.trailingRoles, options.roleSeparators)
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
