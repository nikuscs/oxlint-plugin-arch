import { defineRule } from '@oxlint/plugins'
import { declarationsFileLevelFunctionCandidates, optionsFirst, reactComponentsIsLike } from '../utils/index.ts'

interface NoFileLevelHelpersOptions {
  allowPattern?: string
  detectComponents?: boolean
  hookPattern?: string
}

/**
 * Rejects top-level functions unless they are recognized components, hooks, or names allowed by configuration.
 *
 * Example: `useDialog` can pass as a hook, while a file-level `buildPayload` helper fails.
 */
export const noFileLevelHelpers = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        allowPattern: { type: 'string' },
        detectComponents: { type: 'boolean' },
        hookPattern: { type: 'string' },
      },
    }],
    messages: {
      helper: 'File-level helper {{name}} must move inside its owning component or hook.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          allowPattern,
          detectComponents = true,
          hookPattern = '^use[A-Z]',
        } = optionsFirst<NoFileLevelHelpersOptions>(context, {})
        const allowed = allowPattern ? new RegExp(allowPattern) : null
        const hooks = new RegExp(hookPattern)

        for (const candidate of declarationsFileLevelFunctionCandidates(program)) {
          if ((detectComponents && reactComponentsIsLike(program, candidate))
            || hooks.test(candidate.name)
            || allowed?.test(candidate.name)) {
            continue
          }

          context.report({
            node: candidate.node,
            messageId: 'helper',
            data: { name: candidate.name },
          })
        }
      },
    }
  },
})
