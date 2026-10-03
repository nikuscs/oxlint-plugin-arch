import { defineRule } from '@oxlint/plugins'

/** Require a rule name and a reason in lint disables, such as no-console -- CLI output. */
export const directives = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      directive:
        'Lint disables must name specific rules and explain why after --.',
    },
  },
  createOnce(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const match =
            /^\s*(?:oxlint|eslint)-disable(?:-next-line|-line)?\b(.*)$/s.exec(
              comment.value,
            )
          if (!match) {
            continue
          }
          const [rules, ...reason] = match[1].split('--')
          if (rules.trim() && reason.join('--').trim()) {
            continue
          }
          context.report({ loc: comment.loc, messageId: 'directive' })
        }
      },
    }
  },
})
