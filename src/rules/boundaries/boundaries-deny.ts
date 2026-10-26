import { defineRule } from '@oxlint/plugins'
import { boundariesLiteralSource, boundariesMemberName } from '../../utils/boundaries.utils.ts'
import { optionsFirst, optionsGlob } from '../../utils/options.utils.ts'
import type { BoundariesDenyOptions } from '../../types/boundaries.types.ts'
import type { ESTree } from '@oxlint/plugins'

function boundariesDottedName(node: ESTree.Node): string | null {
  if (node.type === 'Identifier') {
    return node.name
  }

  const object = node.type === 'MemberExpression' ? boundariesDottedName(node.object) : null
  const property = boundariesMemberName(node)

  return object && property ? `${object}.${property}` : null
}

export const boundariesDeny = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          imports: { type: 'object', additionalProperties: { type: 'string' } },
          calls: { type: 'object', additionalProperties: { type: 'string' } },
        },
      },
    ],
    messages: {
      import: "Do not import '{{source}}' here.{{message}}",
      call: "Do not call '{{name}}' here.{{message}}",
    },
  },
  createOnce(context) {
    let imports: [RegExp, string][] = []
    let calls = new Map<string, string>()

    function checkSource(node: ESTree.Node, source: string | undefined) {
      const entry = source === undefined ? undefined : imports.find(([pattern]) => pattern.test(source))

      if (source !== undefined && entry) {
        context.report({
          node,
          messageId: 'import',
          data: { source, message: entry[1] },
        })
      }
    }

    return {
      before() {
        const options = optionsFirst<BoundariesDenyOptions>(context, {})

        imports = Object.entries(options.imports ?? {}).map(([pattern, message]) => [optionsGlob(pattern), message && ` ${message}`])
        calls = new Map(Object.entries(options.calls ?? {}).map(([name, message]) => [name, message && ` ${message}`]))

        if (imports.length === 0 && calls.size === 0) {
          return false
        }
      },
      ImportDeclaration(node) {
        checkSource(node.source, node.source.value)
      },
      ExportNamedDeclaration(node) {
        checkSource(node.source ?? node, node.source?.value)
      },
      ExportAllDeclaration(node) {
        checkSource(node.source, node.source.value)
      },
      ImportExpression(node) {
        checkSource(node.source, boundariesLiteralSource(node))
      },
      CallExpression(node) {
        if (calls.size === 0) {
          return
        }

        const { callee } = node
        const name = [boundariesDottedName(callee), boundariesMemberName(callee)].find((candidate) => candidate !== null && calls.has(candidate))

        if (name) {
          context.report({
            node: callee,
            messageId: 'call',
            data: { name, message: calls.get(name) ?? '' },
          })
        }
      },
    }
  },
})
