import { defineRule } from '@oxlint/plugins'
import { exportsCollect, namingFileBasename, optionsFirst } from '../utils/index.ts'

interface ExportFilePrefixOptions {
  stem?: 'before-first-dot' | 'full-basename'
  normalize?: 'remove-separators' | 'none'
}

/**
 * Checks that exported names start with a prefix taken from the filename.
 *
 * Example: In `billing.client.ts`, `billingClient` passes while `client` fails.
 */
export const exportFilePrefix = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        stem: { type: 'string', enum: ['before-first-dot', 'full-basename'] },
        normalize: { type: 'string', enum: ['remove-separators', 'none'] },
      },
    }],
    messages: {
      prefix: "Export '{{name}}' must start with file prefix '{{prefix}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const options = optionsFirst<ExportFilePrefixOptions>(context, {
          stem: 'before-first-dot',
          normalize: 'remove-separators',
        })
        const basename = namingFileBasename(context.filename).replace(/\.(tsx?|jsx?)$/, '')
        const stem = options.stem === 'full-basename' ? basename : (basename.split('.')[0] ?? '')
        const prefix = options.normalize === 'none' ? stem : stem.replaceAll(/[-_]/g, '').toLowerCase()

        for (const binding of exportsCollect(program)) {
          const name = binding.localName ?? binding.exportedName
          const comparableName = options.normalize === 'none' ? name : name.replaceAll('_', '').toLowerCase()

          if (!comparableName.startsWith(prefix)) {
            context.report({
              node: binding.node,
              messageId: 'prefix',
              data: { name, prefix },
            })
          }
        }
      },
    }
  },
})
