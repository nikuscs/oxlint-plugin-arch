import { defineRule } from '@oxlint/plugins'
import { declarationsCollectNamed, exportsCollect, optionsFirst } from '../utils/index.ts'

interface ExportNamePatternOptions {
  pattern: string
  flags?: string
  ignoreTypeExports?: boolean
  allDeclarations?: boolean
  allowPattern?: string
}

/**
 * Checks exported names, or every function and type, against a regular expression supplied in the rule options.
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
        allDeclarations: { type: 'boolean' },
        allowPattern: { type: 'string' },
      },
      required: ['pattern'],
    }],
    messages: {
      pattern: "'{{name}}' must match {{pattern}}.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          pattern,
          flags,
          ignoreTypeExports = false,
          allDeclarations = false,
          allowPattern,
        } = optionsFirst<ExportNamePatternOptions>(context)
        const allowed = allowPattern ? new RegExp(allowPattern) : null
        const names = allDeclarations
          ? declarationsCollectNamed(program)
          : exportsCollect(program).flatMap((binding) => ignoreTypeExports && binding.typeOnly
            ? []
            : [{ name: binding.localName ?? binding.exportedName, node: binding.node }])
        const seen = new Set<string>()

        for (const item of names) {
          const key = `${item.name}:${item.node.start}:${item.node.end}`

          if (seen.has(key) || allowed?.test(item.name) || new RegExp(pattern, flags).test(item.name)) {
            continue
          }

          seen.add(key)
          context.report({
            node: item.node,
            messageId: 'pattern',
            data: { name: item.name, pattern },
          })
        }
      },
    }
  },
})
