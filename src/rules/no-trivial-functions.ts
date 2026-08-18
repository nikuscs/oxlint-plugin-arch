import { defineRule } from '@oxlint/plugins'
import {
  declarationsIsTrivialFunction,
  declarationsTopLevelUnexportedFunctions,
  exportsCollectFunctions,
  optionsFirst,
} from '../utils/index.ts'

interface NoTrivialFunctionsOptions {
  allowPattern?: string
}

/**
 * Rejects top-level functions that are empty or only forward a lookup, identifier, or other call.
 *
 * Example: `export function loadUser(id: string) { return fetchUser(id) }` fails; a function with branching or extra statements passes.
 */
export const noTrivialFunctions = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        allowPattern: { type: 'string' },
      },
    }],
    messages: {
      trivial: 'Function {{name}} does nothing useful; inline it at the call site.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { allowPattern } = optionsFirst<NoTrivialFunctionsOptions>(context, {})
        const allowed = allowPattern ? new RegExp(allowPattern) : null
        const seen = new Set<string>()

        for (const item of [...exportsCollectFunctions(program), ...declarationsTopLevelUnexportedFunctions(program)]) {
          const key = `${item.name}:${item.node.start}:${item.node.end}`

          if (seen.has(key) || allowed?.test(item.name) || !declarationsIsTrivialFunction(item.node)) {
            continue
          }

          seen.add(key)
          context.report({
            node: item.node,
            messageId: 'trivial',
            data: { name: item.name },
          })
        }
      },
    }
  },
})
