import { defineRule } from '@oxlint/plugins'
import {
  declarationsIsObjectParam,
  declarationsPublicServiceMethods,
  declarationsTopLevelUnexportedFunctions,
  exportsCollectFunctions,
  optionsFirst,
  optionsOptionalPatterns,
  optionsPatternSchema,
  optionsPatternsTest,
} from '../utils/index.ts'
import type { OptionsPattern } from '../utils/index.ts'

interface RequireObjectParamsOptions {
  maxParams?: number
  allDeclarations?: boolean
  serviceMethods?: boolean
  allowPattern?: OptionsPattern
}

/**
 * Requires functions to take at most N object-shaped parameters instead of positional arguments.
 *
 * Example: `createUser({ name })` passes; `createUser(name, email)` fails. With `maxParams: 2`, `(deps, params)` passes.
 */
export const requireObjectParams = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        maxParams: { type: 'integer', minimum: 1 },
        serviceMethods: { type: 'boolean' },
        allDeclarations: { type: 'boolean' },
        allowPattern: optionsPatternSchema,
      },
    }],
    messages: {
      objectParams: '{{label}} {{name}} must accept at most {{maxParams}} object parameter{{s}}.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { maxParams = 1, allDeclarations = false, serviceMethods = false, allowPattern } = optionsFirst<RequireObjectParamsOptions>(context, {})
        const allowed = optionsOptionalPatterns(allowPattern)
        const seen = new Set<string>()
        const functions = allDeclarations
          ? [...exportsCollectFunctions(program), ...declarationsTopLevelUnexportedFunctions(program)]
          : exportsCollectFunctions(program)

        if (serviceMethods) functions.push(...declarationsPublicServiceMethods(program))

        for (const item of functions) {
          const key = `${item.name}:${item.node.start}:${item.node.end}`

          if (seen.has(key) || optionsPatternsTest(allowed, item.name)) {
            continue
          }

          seen.add(key)

          if (item.node.params.length > maxParams || item.node.params.some((param) => !declarationsIsObjectParam(param))) {
            context.report({
              node: item.node,
              messageId: 'objectParams',
              data: {
                label: allDeclarations ? 'Function' : 'Exported function',
                name: item.name,
                maxParams: maxParams === 1 ? 'one' : String(maxParams),
                s: maxParams === 1 ? '' : 's',
              },
            })
          }
        }
      },
    }
  },
})
