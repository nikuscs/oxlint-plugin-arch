import { defineRule } from '@oxlint/plugins'
import { exportsCollectFunctions, factoriesExpandTemplate, namingFileBasename, namingMatchTemplate, optionsFirst } from '../utils/index.ts'

interface FilenameExportNameOptions {
  file: string
  export: string
  mode?: 'all' | 'some'
  placeholderPattern?: string
}

/**
 * Builds an expected function name from filename placeholders, then checks exported functions against it.
 *
 * Example: `user-action.create.ts` can require `makeUserActionCreate`; `mode: some` allows additional exports.
 */
export const filenameExportName = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        file: { type: 'string' },
        export: { type: 'string' },
        mode: { type: 'string', enum: ['all', 'some'] },
        placeholderPattern: { type: 'string' },
      },
      required: ['file', 'export'],
    }],
    messages: {
      mismatch: "Exported function '{{actual}}' must match '{{expected}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          file,
          export: exportTemplate,
          mode = 'all',
          placeholderPattern,
        } = optionsFirst<FilenameExportNameOptions>(context)
        const groups = namingMatchTemplate(namingFileBasename(context.filename), file, placeholderPattern)

        if (!groups) {
          return
        }

        const expected = factoriesExpandTemplate(exportTemplate, groups)
        const exported = exportsCollectFunctions(program)

        if (mode === 'some') {
          if (!exported.some((item) => item.name === expected)) {
            const first = exported.at(0)
            context.report({
              node: first?.node ?? program,
              messageId: 'mismatch',
              data: { actual: first?.name ?? '<none>', expected },
            })
          }
          return
        }

        for (const item of exported) {
          if (item.name !== expected) {
            context.report({
              node: item.node,
              messageId: 'mismatch',
              data: { actual: item.name, expected },
            })
          }
        }
      },
    }
  },
})
