import { defineRule } from '@oxlint/plugins'
import { astImportAliases, astResolvedCallName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { CodePairedCallOptions, CodePairedCallState } from '../../types/code.types.ts'

export const codePairedCall = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          when: { type: 'string' },
          require: { type: 'string' },
          pairs: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                when: { type: 'string' },
                require: { type: 'string' },
              },
              required: ['when', 'require'],
            },
          },
        },
        anyOf: [{ required: ['when', 'require'] }, { required: ['pairs'] }],
      },
    ],
    messages: {
      paired: '{{when}} requires a call to {{require}} in the same file.',
    },
  },
  createOnce(context) {
    let aliases = new Map<string, string>()
    let pairs: CodePairedCallState[] = []

    return {
      before() {
        const { when, require, pairs: configured = [] } = optionsFirst<CodePairedCallOptions>(context)
        const all = when && require ? [{ when, require }, ...configured] : configured
        pairs = all.map((pair) => ({ ...pair, firstWhen: null, sawRequired: false }))
      },
      Program(program) {
        aliases = astImportAliases(program)
      },
      CallExpression(node) {
        const name = astResolvedCallName(node, aliases)

        for (const pair of pairs) {
          if (name === pair.when) {
            pair.firstWhen ??= node
          }

          if (name === pair.require) {
            pair.sawRequired = true
          }
        }
      },
      after() {
        for (const { firstWhen, sawRequired, when, require } of pairs) {
          if (firstWhen && !sawRequired) {
            context.report({
              node: firstWhen,
              messageId: 'paired',
              data: { when, require },
            })
          }
        }
      },
    }
  },
})
