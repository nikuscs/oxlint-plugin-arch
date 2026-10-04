import { defineRule } from '@oxlint/plugins'
import type { SourceCode } from '@oxlint/plugins'

/**
 * Requires an object-literal property key and the start of its value to share a line.
 *
 * Example: `{ id:\n  n }` fails; `{ id: n }` passes. Destructuring is ignored.
 */
export const keyValueSameLine = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [],
    messages: {
      sameLine: 'Keep the object key and the start of its value on the same line.',
    },
  },
  createOnce(context) {
    let source: SourceCode

    return {
      before() {
        source = context.sourceCode
      },
      Property(node) {
        if (node.parent.type !== 'ObjectExpression' || node.shorthand || node.method || node.kind !== 'init') {
          return
        }

        let keyEnd = node.key.range[1]
        let keyEndLine = node.key.loc.end.line
        if (node.computed) {
          const bracket = source.getTokensBetween(node.key, node.value).find((token) => token.value === ']')
          if (bracket) {
            keyEnd = bracket.range[1]
            keyEndLine = bracket.loc.end.line
          }
        }

        // Why: ESTree drops parentheses, so `key: (` would look like the value starts on the next line.
        const tokens = source.getTokensBetween(node.key, node.value)
        const valueStart = tokens[tokens.findIndex((token) => token.value === ':') + 1] ?? node.value
        if (keyEndLine === valueStart.loc.start.line) {
          return
        }

        const between = source.text.slice(keyEnd, node.value.range[0])
        const commentsBetween = source.commentsExistBetween(node.key, node.value)
        const onlyColonAndSpace = /^[\s:]*$/.test(between) && between.includes(':')

        context.report({
          node,
          messageId: 'sameLine',
          fix(fixer) {
            return !commentsBetween && onlyColonAndSpace
              ? fixer.replaceTextRange([keyEnd, node.value.range[0]], ': ')
              : null
          },
        })
      },
    }
  },
})
