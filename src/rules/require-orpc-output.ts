import { defineRule } from '@oxlint/plugins'
import {
  astStaticMemberName,
  optionsFirst,
  orpcFindChainCall,
  orpcIsNamedOrComposedArgument,
} from '../utils/index.ts'

interface RequireOrpcOutputOptions {
  composers: string[]
  handlerMethod?: string
  outputMethod?: string
}

/**
 * Checks oRPC procedure chains for a configured output method before the configured handler method.
 *
 * Example: `.output(userSchema).handler(...)` passes; `.handler(...)` without output fails.
 */
export const requireOrpcOutput = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        composers: { type: 'array', items: { type: 'string' } },
        handlerMethod: { type: 'string' },
        outputMethod: { type: 'string' },
      },
      required: ['composers'],
    }],
    messages: {
      missing: 'oRPC procedures must declare .output() before .handler().',
      invalid: 'oRPC .output() must use a named schema or configured composer with a named schema.',
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return
        }

        const { composers, handlerMethod = 'handler', outputMethod = 'output' } = optionsFirst<RequireOrpcOutputOptions>(context)

        if (astStaticMemberName(node.callee) !== handlerMethod) {
          return
        }

        const output = orpcFindChainCall(node.callee.object, outputMethod)

        if (!output) {
          context.report({ node, messageId: 'missing' })
          return
        }

        if (!orpcIsNamedOrComposedArgument(output.arguments[0], new Set(composers))) {
          context.report({ node: output, messageId: 'invalid' })
        }
      },
    }
  },
})
