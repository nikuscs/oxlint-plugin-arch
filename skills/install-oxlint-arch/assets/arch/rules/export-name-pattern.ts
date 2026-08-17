import { defineRule } from '@oxlint/plugins'
import { exportsCollect, optionsFirst } from '../utils/index.ts'

interface ExportNamePatternOptions {
  pattern: string
  flags?: string
  ignoreTypeExports?: boolean
}

/**
 * Checks every exported name against a regular expression supplied in the rule options.
 *
 * Example: With `^user[A-Z]`, `userGet` passes while `getUser` fails.
 */
export const exportNamePattern = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        pattern: { type: 'string' },
        flags: { type: 'string' },
        ignoreTypeExports: { type: 'boolean' },
      },
      required: ['pattern'],
    }],
    messages: {
      pattern: "Export '{{name}}' must match {{pattern}}.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          pattern,
          flags,
          ignoreTypeExports = false,
        } = optionsFirst<ExportNamePatternOptions>(context)

        for (const binding of exportsCollect(program)) {
          if (ignoreTypeExports && binding.typeOnly) {
            continue
          }

          const name = binding.localName ?? binding.exportedName

          if (!new RegExp(pattern, flags).test(name)) {
            context.report({
              node: binding.node,
              messageId: 'pattern',
              data: { name, pattern },
            })
          }
        }
      },
    }
  },
})
