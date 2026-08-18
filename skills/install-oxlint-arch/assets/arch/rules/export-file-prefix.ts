import { defineRule } from '@oxlint/plugins'
import { declarationsCollectNamed, exportsCollect, namingFileBasename, optionsFirst } from '../utils/index.ts'

interface ExportFilePrefixOptions {
  stem?: 'before-first-dot' | 'full-basename'
  normalize?: 'remove-separators' | 'none'
  allDeclarations?: boolean
  allowPattern?: string
}

/**
 * Checks that exported names start with a prefix taken from the filename, and can also check every function and type in the file.
 *
 * Example: In `foo-chart.tsx`, `fooChartPreview` and `interface FooChartPreviewProps` pass; `preview` fails when `allDeclarations` is on.
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
        allDeclarations: { type: 'boolean' },
        allowPattern: { type: 'string' },
      },
    }],
    messages: {
      prefix: "'{{name}}' must start with file prefix '{{prefix}}'.",
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
        const allowed = options.allowPattern ? new RegExp(options.allowPattern) : null
        const names = options.allDeclarations
          ? declarationsCollectNamed(program)
          : exportsCollect(program).map((binding) => ({
              name: binding.localName ?? binding.exportedName,
              node: binding.node,
            }))
        const seen = new Set<string>()

        for (const item of names) {
          const key = `${item.name}:${item.node.start}:${item.node.end}`
          const comparableName = options.normalize === 'none' ? item.name : item.name.replaceAll('_', '').toLowerCase()

          if (seen.has(key) || allowed?.test(item.name) || comparableName.startsWith(prefix)) {
            continue
          }

          seen.add(key)
          context.report({
            node: item.node,
            messageId: 'prefix',
            data: { name: item.name, prefix },
          })
        }
      },
    }
  },
})
