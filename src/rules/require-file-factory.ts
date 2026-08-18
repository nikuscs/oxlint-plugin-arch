import { defineRule } from '@oxlint/plugins'
import {
  declarationsCollectFunctions,
  exportsCollectFunctions,
  namingFileBasename,
  namingPascalCase,
  optionsFirst,
} from '../utils/index.ts'

interface RequireFileFactoryOptions {
  factory: string
  allDeclarations?: boolean
}

/**
 * Derives one expected factory name from the filename and requires that function to exist.
 *
 * Example: With `make{Stem}`, `email-renderer.ts` requires `makeEmailRenderer`.
 */
export const requireFileFactory = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        factory: { type: 'string' },
        allDeclarations: { type: 'boolean' },
      },
      required: ['factory'],
    }],
    messages: {
      factory: "Function '{{actual}}' must be named '{{expected}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { factory, allDeclarations = false } = optionsFirst<RequireFileFactoryOptions>(context)
        const stem = namingFileBasename(context.filename).replace(/\.(tsx?|jsx?)$/, '')
        const expected = factory
          .replaceAll('{Stem}', namingPascalCase(stem))
          .replaceAll('{stem}', stem)
        const functions = allDeclarations ? declarationsCollectFunctions(program) : exportsCollectFunctions(program)

        if (functions.length === 0) {
          context.report({
            node: program,
            messageId: 'factory',
            data: { actual: '<none>', expected },
          })
          return
        }

        for (const item of functions) {
          if (item.name !== expected) {
            context.report({
              node: item.node,
              messageId: 'factory',
              data: { actual: item.name, expected },
            })
          }
        }
      },
    }
  },
})
