import { defineRule } from '@oxlint/plugins'
import { declarationsNamed, declarationsUnique } from '../../utils/declarations.utils.ts'
import { exportsCollect } from '../../utils/exports.utils.ts'
import { optionsFirst, optionsPatternLabel, optionsPatterns, optionsPatternSchema, optionsPatternsTest, optionsPatternsWithEmpty } from '../../utils/options.utils.ts'
import type { NamingExportPatternOptions } from '../../types/naming.types.ts'

export const namingExportPattern = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          pattern: optionsPatternSchema,
          flags: { type: 'string' },
          ignoreTypeExports: { type: 'boolean' },
          allDeclarations: { type: 'boolean' },
          allowPattern: optionsPatternSchema,
        },
        required: ['pattern'],
      },
    ],
    messages: {
      pattern: "'{{name}}' must match {{pattern}}.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { pattern, flags, ignoreTypeExports = false, allDeclarations = false, allowPattern } =
          optionsFirst<NamingExportPatternOptions>(context)

        const allowed = optionsPatterns(allowPattern)
        const expected = optionsPatternsWithEmpty(pattern, flags)

        const names = allDeclarations
          ? declarationsNamed(program)
          : exportsCollect(program).flatMap((binding) =>
            ignoreTypeExports && binding.typeOnly ? [] : [{ name: binding.localName ?? binding.exportedName, node: binding.node }],
          )

        for (const item of declarationsUnique(names)) {
          if (optionsPatternsTest(allowed, item.name) || optionsPatternsTest(expected, item.name)) {
            continue
          }

          context.report({
            node: item.node,
            messageId: 'pattern',
            data: { name: item.name, pattern: optionsPatternLabel(pattern) },
          })
        }
      },
    }
  },
})
