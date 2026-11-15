import { defineRule } from '@oxlint/plugins'
import { astDottedName, astIsCall } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsPatternSchema, optionsPatternsTest, optionsWildcards } from '../../utils/options.utils.ts'
import type { CodeInsideCompiled, CodeInsideOptions } from '../../types/code.types.ts'
import type { ESTree } from '@oxlint/plugins'

function codeInsideOwners(node: ESTree.Node): string[] {
  const parent = node.parent

  if (!parent) {
    return []
  }

  const callback = node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'
  const owner = callback && astIsCall(parent) && parent.arguments.some((item) => item === node) ? astDottedName(parent.callee) : undefined

  return [...(owner === undefined ? [] : [owner]), ...codeInsideOwners(parent)]
}

export const codeInside = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          inside: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                callee: optionsPatternSchema,
                calls: { type: 'object', additionalProperties: { type: 'string' } },
              },
              required: ['callee', 'calls'],
            },
          },
        },
        required: ['inside'],
      },
    ],
    messages: {
      inside: "Do not call '{{name}}' inside {{owner}}.{{message}}",
    },
  },
  createOnce(context) {
    let entries: CodeInsideCompiled[] = []

    return {
      before() {
        entries = optionsFirst<CodeInsideOptions>(context, { inside: [] }).inside.map((entry) => ({
          callees: optionsWildcards(entry.callee),
          calls: Object.entries(entry.calls).map(([name, message]): [RegExp, string] => [optionsWildcards(name)[0], message && ` ${message}`]),
        }))

        if (entries.length === 0) {
          return false
        }
      },
      CallExpression(node) {
        const name = astDottedName(node.callee)

        if (name === undefined) {
          return
        }

        const banned = entries.flatMap(({ callees, calls }) => calls.flatMap(([pattern, message]) => (pattern.test(name) ? [{ callees, message }] : [])))

        if (banned.length === 0) {
          return
        }

        const owners = codeInsideOwners(node)

        for (const { callees, message } of banned) {
          const owner = owners.find((item) => optionsPatternsTest(callees, item))

          if (owner !== undefined) {
            context.report({
              node: node.callee,
              messageId: 'inside',
              data: { name, owner, message },
            })
          }
        }
      },
    }
  },
})
