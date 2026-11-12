import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { ReactDynamicClassesOptions } from '../../types/react.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const reactDynamicClasses = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { attributes: { type: 'array', items: { type: 'string' } }, message: { type: 'string' } },
      },
    ],
    messages: { forbidden: '{{message}}' },
  },
  createOnce(context) {
    let attributes = new Set<string>()
    let message = ''

    const check = (node: ESTree.Node) => {
      for (let parent: ESTree.Node | null = node.parent; parent; parent = parent.parent) {
        if (parent.type === 'JSXAttribute' && parent.name.type === 'JSXIdentifier' && attributes.has(parent.name.name)) {
          context.report({
            node,
            messageId: 'forbidden',
            data: { message },
          })
          return
        }
      }
    }

    return {
      before() {
        const options = optionsFirst<ReactDynamicClassesOptions>(context, {})
        attributes = new Set(options.attributes ?? ['className'])
        message = options.message ?? 'Write complete class names instead of constructing them dynamically.'
      },
      'JSXAttribute TemplateLiteral[expressions.length>0]': check,
      'JSXAttribute BinaryExpression[operator="+"]': check,
    }
  },
})
