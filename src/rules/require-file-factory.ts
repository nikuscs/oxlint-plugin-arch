import { defineRule } from '@oxlint/plugins'
import { exportsCollectFunctions, namingFileBasename, namingPascalCase, optionsFirst } from '../utils/index.ts'

interface RequireFileFactoryOptions {
  factory: string
}

/**
 * Derives one expected factory name from the filename and checks every exported function against that template.
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
      },
      required: ['factory'],
    }],
    messages: {
      factory: "Exported function '{{actual}}' must be named '{{expected}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { factory } = optionsFirst<RequireFileFactoryOptions>(context)
        const stem = namingFileBasename(context.filename).replace(/\.(tsx?|jsx?)$/, '')
        const expected = factory
          .replaceAll('{Stem}', namingPascalCase(stem))
          .replaceAll('{stem}', stem)

        for (const item of exportsCollectFunctions(program)) {
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
