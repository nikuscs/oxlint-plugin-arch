import { defineRule } from '@oxlint/plugins'
import { astDottedName, astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsMessage, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { EffectYieldNameOptions } from '../../types/effect.types.ts'

export const effectYieldName = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          names: { type: 'object', additionalProperties: optionsPatternSchema },
          allow: optionsPatternSchema,
          message: { type: 'string' },
        },
      },
    ],
    messages: {
      name: "Name this '{{expected}}', not '{{actual}}': it holds {{source}}.{{message}}",
    },
  },
  createOnce(context) {
    return {
      VariableDeclarator(node) {
        const { id, init } = node

        if (id.type !== 'Identifier' || init?.type !== 'YieldExpression' || !init.delegate || init.argument?.type !== 'MemberExpression') {
          return
        }

        const service = astMemberName(init.argument)
        const source = astDottedName(init.argument)

        if (!service || !source || !/^[A-Z]/.test(service)) {
          return
        }

        const options = optionsFirst<EffectYieldNameOptions>(context, {})
        const named = options.names?.[source] ?? options.names?.[`*.${service}`]
        const expected = named === undefined ? [`${service.charAt(0).toLowerCase()}${service.slice(1)}`] : [named].flat()

        if (!expected.includes(id.name) && !optionsPatternsTest(optionsPatterns(options.allow), id.name)) {
          context.report({
            node: id,
            messageId: 'name',
            data: { expected: expected.join(' or '), actual: id.name, source, message: optionsMessage(options.message) },
          })
        }
      },
    }
  },
})
