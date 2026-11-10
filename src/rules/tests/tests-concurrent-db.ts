import { defineRule } from '@oxlint/plugins'
import { astDottedName, astStaticString } from '../../utils/ast.utils.ts'
import { declarationsIsFunctionValue } from '../../utils/declarations.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { TestsConcurrentDbOptions } from '../../types/tests.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const testsConcurrentDb = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          message: { type: 'string' },
          fixtures: { type: 'array', items: { type: 'string', minLength: 1 }, default: ['db'] },
          callees: { type: 'array', items: { type: 'string', minLength: 1 }, default: ['test.concurrent'] },
        },
      },
    ],
    messages: { forbidden: '{{message}}' },
  },
  createOnce(context) {
    let message = ''
    let fixtures = new Set<string>()
    let callees = new Set<string>()

    return {
      before() {
        const options = optionsFirst<TestsConcurrentDbOptions>(context, {})
        message = options.message ?? 'Obtain an isolated database fixture for concurrent tests.'
        fixtures = new Set(options.fixtures ?? ['db'])
        callees = new Set(options.callees ?? ['test.concurrent'])
      },
      CallExpression(node) {
        const callback = callees.has(astDottedName(node.callee) ?? '') ? node.arguments.findLast(declarationsIsFunctionValue) : undefined
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
          const key = property.type === 'Property' && !property.computed ? property.key : undefined

          if (fixtures.has((key?.type === 'Identifier' ? key.name : key && astStaticString(key)) ?? '')) {
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
