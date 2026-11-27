import { defineRule } from '@oxlint/plugins'
import { astDottedName, astStaticString } from '../../utils/ast.utils.ts'
import { namingCaptures, namingCaptureSchemaProperties, namingExpand } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsMessage, optionsPatternSchema, optionsPatternsTest, optionsWildcards } from '../../utils/options.utils.ts'
import type { EffectConfigKeysOptions } from '../../types/effect.types.ts'

const effectConfigKeysReaders = [
  'string',
  'number',
  'integer',
  'boolean',
  'redacted',
  'url',
  'port',
  'duration',
  'date',
  'bigint',
  'logLevel',
  'nonEmptyString',
  'secret',
]

const effectConfigKeysCallees = effectConfigKeysReaders.flatMap((reader) => [
  `Config.${reader}`,
  `Config.${reader === 'bigint' ? 'BigInt' : `${reader.charAt(0).toUpperCase()}${reader.slice(1)}`}`,
])

export const effectConfigKeys = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          prefix: optionsPatternSchema,
          allow: { type: 'array', items: { type: 'string', minLength: 1 } },
          callees: { type: 'array', items: { type: 'string', minLength: 1 } },
          message: { type: 'string' },
          ...namingCaptureSchemaProperties,
        },
      },
    ],
    messages: {
      prefix: "Config key '{{key}}' must start with {{prefixes}}.{{message}}",
    },
  },
  createOnce(context) {
    let prefixes: string[] = []
    let callees: RegExp[] = []
    let message = ''

    return {
      before() {
        const options = optionsFirst<EffectConfigKeysOptions>(context, {})
        const captures = namingCaptures(context.filename, options)

        if (!captures) {
          return false
        }

        const templates = [options.prefix ?? []].flat().map((template) => namingExpand(template, captures, false))
        prefixes = [...new Set([...templates, ...(options.allow ?? [])])].filter(Boolean)
        callees = optionsWildcards(options.callees ?? effectConfigKeysCallees)
        message = optionsMessage(options.message)

        if (prefixes.length === 0) {
          return false
        }
      },
      CallExpression(node) {
        const callee = astDottedName(node.callee)
        const first = node.arguments.at(0)
        const key = first ? astStaticString(first) : undefined

        if (!first || key === undefined || callee === undefined || !optionsPatternsTest(callees, callee)) {
          return
        }

        if (!prefixes.some((prefix) => key.startsWith(prefix))) {
          context.report({
            node: first,
            messageId: 'prefix',
            data: { key, prefixes: prefixes.map((prefix) => `'${prefix}'`).join(' or '), message },
          })
        }
      },
    }
  },
})
