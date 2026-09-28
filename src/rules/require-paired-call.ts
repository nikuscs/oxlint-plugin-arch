import { defineRule } from '@oxlint/plugins'
import { astImportedCallAliases, astResolvedCallName, optionsFirst } from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface RequirePairedCallPair {
  when: string
  require: string
}

interface RequirePairedCallOptions {
  when?: string
  require?: string
  pairs?: RequirePairedCallPair[]
}

interface PairState extends RequirePairedCallPair {
  firstWhen: ESTree.CallExpression | null
  sawRequired: boolean
}

/**
 * Requires a second configured call whenever the trigger call appears anywhere in the same file.
 *
 * Example: A file calling `useForm` can require a call to `standardSchemaResolver`.
 */
export const requirePairedCall = defineRule({
  meta: {
    type: 'problem',
    schema: [{
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
      anyOf: [
        { required: ['when', 'require'] },
        { required: ['pairs'] },
      ],
    }],
    messages: {
      paired: '{{when}} requires a call to {{require}} in the same file.',
    },
  },
  createOnce(context) {
    let aliases = new Map<string, string>()
    let pairs: PairState[] = []

    return {
      before() {
        const options = optionsFirst<RequirePairedCallOptions>(context)
        const configured = [
          ...(options.when && options.require ? [{ when: options.when, require: options.require }] : []),
          ...(options.pairs ?? []),
        ]

        aliases = new Map()
        pairs = configured.map((pair) => ({ ...pair, firstWhen: null, sawRequired: false }))
      },
      Program(program) {
        aliases = astImportedCallAliases(program)
      },
      CallExpression(node) {
        const name = astResolvedCallName(node, aliases)

        for (const pair of pairs) {
          if (name === pair.when && !pair.firstWhen) {
            pair.firstWhen = node
          }

          if (name === pair.require) {
            pair.sawRequired = true
          }
        }
      },
      after() {
        for (const pair of pairs) {
          if (!pair.firstWhen || pair.sawRequired) {
            continue
          }

          context.report({
            node: pair.firstWhen,
            messageId: 'paired',
            data: { when: pair.when, require: pair.require },
          })
        }
      },
    }
  },
})
