import { defineRule } from '@oxlint/plugins'
import { astStaticString } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsGlob, optionsMessage, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { CopyHardcodedOptions } from '../../types/copy.types.ts'
import type { ESTree } from '@oxlint/plugins'

const copyHardcodedAttributes = ['placeholder', 'title', 'aria-label', 'alt', 'label']

const copyHardcodedIgnore = String.raw`^(?:https?:|mailto:|tel:|/|#|\.{1,2}/)\S*$`

const copyHardcodedCodeToken = /^[\w(){}[\].,:;=<>'"`/*+-]+$/

const copyHardcodedCodeMark = /[A-Za-z0-9]_[A-Za-z0-9]|^[a-z]{2,}[A-Z][a-z]|\w[([{=]|=\w|[{}]/

const copyHardcodedUnit = /^[/+~×x-]?\d[\d.,]*\p{L}{0,3}$/u

function copyHardcodedCode(text: string): boolean {
  const tokens = text.split(' ')
  const units = tokens.filter((token) => /\p{L}/u.test(token)).every((token) => copyHardcodedUnit.test(token))

  return units || (tokens.every((token) => copyHardcodedCodeToken.test(token)) && tokens.some((token) => copyHardcodedCodeMark.test(token)))
}

export const copyHardcoded = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          attributes: { type: 'array', items: { type: 'string', minLength: 1 } },
          ignore: optionsPatternSchema,
          exclude: optionsPatternSchema,
          message: { type: 'string' },
        },
      },
    ],
    messages: {
      text: "Move '{{text}}' out of the component; user-facing text comes from your copy source.{{message}}",
    },
  },
  createOnce(context) {
    let attributes = new Set(copyHardcodedAttributes)
    let ignored: RegExp[] = []
    let message = ''

    function check(node: ESTree.Node, value: string | undefined): void {
      const text = value?.replaceAll(/&(?:#\w+|[A-Za-z]\w*);/g, ' ').replaceAll(/\s+/g, ' ').trim() ?? ''

      if (!/\p{L}/u.test(text) || copyHardcodedCode(text) || optionsPatternsTest(ignored, text)) {
        return
      }

      context.report({
        node,
        messageId: 'text',
        data: { text: text.length > 40 ? `${text.slice(0, 39).trimEnd()}…` : text, message },
      })
    }

    function checkExpression(node: ESTree.Node): void {
      const value = node.type === 'JSXExpressionContainer' && node.expression.type !== 'JSXEmptyExpression' ? node.expression : node

      check(value, astStaticString(value))
    }

    return {
      before() {
        const options = optionsFirst<CopyHardcodedOptions>(context, {})
        const filename = context.filename.replaceAll('\\', '/')

        if ([options.exclude ?? []].flat().some((glob) => optionsGlob(glob.startsWith('/') ? glob : `**/${glob}`).test(filename))) {
          return false
        }

        attributes = new Set(options.attributes ?? copyHardcodedAttributes)
        ignored = optionsPatterns(options.ignore ?? copyHardcodedIgnore, 'u')
        message = optionsMessage(options.message)
      },
      JSXText(node) {
        check(node, node.value)
      },
      JSXExpressionContainer(node) {
        if (node.parent.type === 'JSXElement' || node.parent.type === 'JSXFragment') {
          checkExpression(node)
        }
      },
      JSXAttribute(node) {
        if (node.name.type === 'JSXIdentifier' && attributes.has(node.name.name) && node.value) {
          checkExpression(node.value)
        }
      },
    }
  },
})
