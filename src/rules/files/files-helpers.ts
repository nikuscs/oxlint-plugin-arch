import { defineRule } from '@oxlint/plugins'
import { declarationsTopLevelCandidates } from '../../utils/declarations.utils.ts'
import { exportsCollect } from '../../utils/exports.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest, optionsPatternsWithEmpty } from '../../utils/options.utils.ts'
import { reactIsComponent } from '../../utils/react.utils.ts'
import type { FilesHelpersOptions } from '../../types/files.types.ts'

export const filesHelpers = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: optionsPatternSchema,
          message: { type: 'string' },
          components: { type: 'boolean' },
          hooks: optionsPatternSchema,
        },
      },
    ],
    messages: {
      helper: '{{name}}: {{message}}',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          allow: allowPattern,
          message = 'Keep this helper inside its owning component or hook.',
          components: detectComponents = true,
          hooks: hookPattern = '^use[A-Z]',
        } = optionsFirst<FilesHelpersOptions>(context, {})

        const allowed = optionsPatterns(allowPattern)
        const hooks = optionsPatternsWithEmpty(hookPattern)
        const exports = exportsCollect(program)

        for (const candidate of declarationsTopLevelCandidates(program)) {
          const { name, node } = candidate

          const exempt =
            (detectComponents && reactIsComponent(program, candidate)) ||
            optionsPatternsTest(hooks, name) ||
            optionsPatternsTest(allowed, name) ||
            exports.some((binding) => binding.localName === name && optionsPatternsTest(allowed, binding.exportedName))

          if (!exempt) {
            context.report({
              node,
              messageId: 'helper',
              data: { name, message },
            })
          }
        }
      },
    }
  },
})
