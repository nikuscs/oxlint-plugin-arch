import { defineRule } from '@oxlint/plugins'
import { declarationsIsObjectParam, exportsCollectFunctions } from '../utils/index.ts'

/**
 * Requires exported functions to take at most one object-shaped parameter instead of positional arguments.
 *
 * Example: `createUser({ name })` passes; `createUser(name, email)` fails.
 */
export const requireObjectParams = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      objectParams: 'Exported function {{name}} must accept at most one object parameter.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        for (const item of exportsCollectFunctions(program)) {
          if (item.node.params.length > 1 || item.node.params.some((param) => !declarationsIsObjectParam(param))) {
            context.report({
              node: item.node,
              messageId: 'objectParams',
              data: { name: item.name },
            })
          }
        }
      },
    }
  },
})
