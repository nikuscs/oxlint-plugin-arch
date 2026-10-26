import { defineRule } from '@oxlint/plugins'
import { astDottedName } from '../../utils/ast.utils.ts'
import { declarationsIsFunctionValue } from '../../utils/declarations.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { ESTree } from '@oxlint/plugins'

export const testsConcurrentDb = defineRule({
  meta: {
    type: 'problem',
    schema: [{ type: 'object', properties: { message: { type: 'string' } }, additionalProperties: false }],
    messages: { forbidden: '{{message}}' },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const callback = astDottedName(node.callee) === 'test.concurrent' ? node.arguments.findLast(declarationsIsFunctionValue) : undefined
        const parameter = callback?.params.at(0)
        const patterns: ESTree.ObjectPattern[] = parameter?.type === 'ObjectPattern' ? [parameter] : []

        if (callback && parameter?.type === 'Identifier') {
          const variable = context.sourceCode.getDeclaredVariables(callback).find((entry) => entry.identifiers.includes(parameter))

          for (const reference of variable?.references ?? []) {
            const declarator = reference.identifier.parent

            if (declarator.type === 'VariableDeclarator' && declarator.init === reference.identifier && declarator.id.type === 'ObjectPattern') {
              patterns.push(declarator.id)
            }
          }
        }

        for (const property of patterns.flatMap((pattern) => pattern.properties)) {
          if (property.type === 'Property' && property.key.type === 'Identifier' && property.key.name === 'db') {
            const { message = 'Obtain an isolated database fixture for concurrent tests.' } = optionsFirst<{ message?: string }>(context, {})
            context.report({
              node: property,
              messageId: 'forbidden',
              data: { message },
            })
          }
        }
      },
    }
  },
})
