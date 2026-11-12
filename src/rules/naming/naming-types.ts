import { defineRule } from '@oxlint/plugins'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { NamingTypesOptions } from '../../types/naming.types.ts'

export const namingTypes = defineRule({
  meta: {
    type: 'problem',
    schema: [{ type: 'object', additionalProperties: false, properties: { pattern: optionsPatternSchema, message: { type: 'string' } } }],
    messages: { forbidden: '{{message}}' },
  },
  createOnce(context) {
    let patterns: RegExp[] = []
    let message = ''

    return {
      before() {
        const options = optionsFirst<NamingTypesOptions>(context, {})
        patterns = optionsPatterns(options.pattern ?? '^[A-Z][a-zA-Z0-9]*$')
        message = options.message ?? 'Use PascalCase for interfaces.'
      },
      TSInterfaceDeclaration(node) {
        if (!optionsPatternsTest(patterns, node.id.name)) {
          context.report({
            node,
            messageId: 'forbidden',
            data: { message },
          })
        }
      },
    }
  },
})
