import { defineRule } from '@oxlint/plugins'

export const layoutKeyValue = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [],
    messages: {
      sameLine: 'Keep the object key and the start of its value on the same line.',
    },
  },
  createOnce(context) {
    return {
      Property(node) {
        if (node.parent.type !== 'ObjectExpression' || node.shorthand || node.method || node.kind !== 'init') {
          return
        }

        const source = context.sourceCode
        const tokens = source.getTokensBetween(node.key, node.value)
        const bracket = node.computed ? tokens.find((token) => token.value === ']') : undefined
        const keyEnd = bracket ?? node.key
        const valueStart = tokens[tokens.findIndex((token) => token.value === ':') + 1] ?? node.value

        if (keyEnd.loc.end.line === valueStart.loc.start.line) {
          return
        }

        const between = source.text.slice(keyEnd.range[1], node.value.range[0])

        const fixable =
          !source.commentsExistBetween(node.key, node.value) && /^[\s:]*$/.test(between) && between.includes(':')

        context.report({
          node,
          messageId: 'sameLine',
          fix: (fixer) => (fixable ? fixer.replaceTextRange([keyEnd.range[1], node.value.range[0]], ': ') : null),
        })
      },
    }
  },
})
