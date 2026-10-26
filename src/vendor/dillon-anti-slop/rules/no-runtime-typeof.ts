import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../../utils/options.utils.ts'
import type { DillonAntiSlopRuntimeTypeofOptions } from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const noRuntimeTypeofRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow runtime typeof checks; external values must be decoded into meaningful types at their I/O boundary.',
    },
    messages: {
      runtimeTypeof: 'A `typeof` check narrows a representation without establishing its contract. Parse input at its I/O boundary, then branch on the domain value.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowInTypeGuards: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ allowInTypeGuards: false }],
  },
  createOnce(context) {
    return {
      UnaryExpression(node) {
        if (node.operator !== 'typeof') {
          return
        }

        if (optionsFirst<DillonAntiSlopRuntimeTypeofOptions>(context, {}).allowInTypeGuards === true) {
          let current: ESTree.Node = node.parent

          while (current.type !== 'Program') {
            if (
              current.type === 'ArrowFunctionExpression' ||
              current.type === 'FunctionDeclaration' ||
              current.type === 'FunctionExpression'
            ) {
              if (current.returnType?.typeAnnotation.type === 'TSTypePredicate') {
                return
              }
              break
            }
            current = current.parent
          }
        }
        context.report({ node, messageId: 'runtimeTypeof' })
      },
    }
  },
})
