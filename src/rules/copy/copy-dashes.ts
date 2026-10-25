import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { CopyDashesOptions } from '../../types/copy.types.ts'
import type { ESTree } from '@oxlint/plugins'

const copyDashesMessage = 'Use a comma, colon, period or parentheses instead.'

export const copyDashes = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          deny: { type: 'array', items: { type: 'string', minLength: 1 } },
          message: { type: 'string' },
        },
      },
    ],
    messages: {
      dash: "Remove '{{dash}}' from this text. {{message}}",
    },
  },
  createOnce(context) {
    let deny = ['\u2014']
    let message = copyDashesMessage

    function check(node: ESTree.Node) {
      const text = context.sourceCode.text
      const raw = text.slice(node.range[0], node.range[1])

      for (const dash of deny) {
        for (let index = raw.indexOf(dash); index !== -1; index = raw.indexOf(dash, index + dash.length)) {
          const start = node.range[0] + index

          context.report({
            loc: { start: context.sourceCode.getLocFromIndex(start), end: context.sourceCode.getLocFromIndex(start + dash.length) },
            messageId: 'dash',
            data: { dash, message },
          })
        }
      }
    }

    return {
      before() {
        const options = optionsFirst<CopyDashesOptions>(context, {})
        const text = context.sourceCode.text

        deny = options.deny ?? ['\u2014']
        message = options.message ?? copyDashesMessage

        if (!deny.some((dash) => text.includes(dash))) {
          return false
        }
      },
      Literal(node) {
        if (typeof node.value === 'string') {
          check(node)
        }
      },
      TemplateElement: check,
      JSXText: check,
    }
  },
})
