import { defineRule } from '@oxlint/plugins'
import {
  declarationsCollectNamed,
  declarationsPublicServiceMethods,
  exportsCollect,
  namingFileBasename,
  namingFilePrefixes,
  namingFileStem,
  namingStemModes,
  optionsFirst,
  optionsOptionalPatterns,
  optionsPatternSchema,
  optionsPatternsTest,
} from '../utils/index.ts'
import type { OptionsPattern } from '../utils/index.ts'

interface ExportFilePrefixOptions {
  stem?: 'before-first-dot' | 'full-basename'
  trailingRoles?: string[]
  roleSeparators?: string[]
  normalize?: 'remove-separators' | 'none'
  singularize?: 'none' | 'trailing-s'
  serviceMethods?: boolean
  allFunctions?: boolean
  allDeclarations?: boolean
  allowPattern?: OptionsPattern
}

/**
 * Checks that exported names start with a prefix taken from the filename, and can also check every function and type in the file.
 *
 * Example: In `foo-chart.tsx`, `fooChartPreview` and `interface FooChartPreviewProps` pass; `preview` fails when `allDeclarations` is on.
 * Example: With `trailingRoles: ['utils']`, `onchain-utils.ts` and `onchain.utils.ts` both use prefix `onchain`.
 */
export const exportFilePrefix = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        stem: { type: 'string', enum: [...namingStemModes] },
        trailingRoles: { type: 'array', items: { type: 'string' } },
        roleSeparators: { type: 'array', items: { type: 'string' } },
        normalize: { type: 'string', enum: ['remove-separators', 'none'] },
        singularize: { type: 'string', enum: ['none', 'trailing-s'] },
        serviceMethods: { type: 'boolean' },
        allFunctions: { type: 'boolean' },
        allDeclarations: { type: 'boolean' },
        allowPattern: optionsPatternSchema,
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
        const stem = namingFileStem(basename, options.stem, options.trailingRoles, options.roleSeparators)
        const prefixes = namingFilePrefixes(stem, options.normalize ?? 'remove-separators', options.singularize ?? 'none')
        const allowed = optionsOptionalPatterns(options.allowPattern)
        const names = options.allDeclarations
          ? declarationsCollectNamed(program)
          : exportsCollect(program).map((binding) => ({
              name: binding.localName ?? binding.exportedName,
              node: binding.node,
            }))
        if (options.allFunctions && !options.allDeclarations) {
          const exportedNames = new Set(names.map((item) => item.name))
          names.push(...declarationsCollectNamed(program).filter((item) =>
            !exportedNames.has(item.name) && (item.node.type === 'FunctionDeclaration'
              || item.node.type === 'VariableDeclarator' && (item.node.init?.type === 'ArrowFunctionExpression'
                || item.node.init?.type === 'FunctionExpression'))))
        }
        if (options.serviceMethods) names.push(...declarationsPublicServiceMethods(program))
        const seen = new Set<string>()

        for (const item of names) {
          const key = `${item.name}:${item.node.start}:${item.node.end}`
          const comparableName = options.normalize === 'none' ? item.name : item.name.replaceAll('_', '').toLowerCase()

          if (seen.has(key) || optionsPatternsTest(allowed, item.name) || prefixes.some((prefix) => comparableName.startsWith(prefix))) {
            continue
          }

          seen.add(key)
          context.report({
            node: item.node,
            messageId: 'prefix',
            data: { name: item.name, prefix: prefixes.join(' or ') },
          })
        }
      },
    }
  },
})
