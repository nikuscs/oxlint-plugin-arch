import { defineRule } from '@oxlint/plugins'
import {
  declarationsFileLevelFunctionCandidates,
  optionsFirst,
  optionsOptionalPatterns,
  optionsPatterns,
  optionsPatternSchema,
  optionsPatternsTest,
  reactComponentsIsLike,
} from '../utils/index.ts'
import type { OptionsPattern } from '../utils/index.ts'

interface NoFileLevelHelpersOptions {
  allowPattern?: OptionsPattern
  detectComponents?: boolean
  message?: string
  hookPattern?: OptionsPattern
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
        allowPattern: optionsPatternSchema,
        message: { type: 'string' },
        detectComponents: { type: 'boolean' },
        hookPattern: optionsPatternSchema,
      },
    }],
    messages: {
      helper: '{{name}}: {{message}}',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          allowPattern,
          message = 'Keep this helper inside its owning component or hook.',
          detectComponents = true,
          hookPattern = '^use[A-Z]',
        } = optionsFirst<NoFileLevelHelpersOptions>(context, {})
        const allowed = optionsOptionalPatterns(allowPattern)
        const hooks = optionsPatterns(hookPattern)

        for (const candidate of declarationsFileLevelFunctionCandidates(program)) {
          if ((detectComponents && reactComponentsIsLike(program, candidate))
            || optionsPatternsTest(hooks, candidate.name)
            || optionsPatternsTest(allowed, candidate.name)) {
            continue
          }

          context.report({
            node: candidate.node,
            messageId: 'helper',
            data: { name: candidate.name, message },
          })
        }
      },
    }
  },
})
