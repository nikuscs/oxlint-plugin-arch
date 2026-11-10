import { defineRule } from '@oxlint/plugins'
import { astDottedName, astUnwrap } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { TypesDuplicateOptions } from '../../types/types.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const typesDuplicate = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          structs: { type: 'array', items: { type: 'string' } },
          min: { type: 'integer', minimum: 1 },
        },
      },
    ],
    messages: { duplicate: '{{name}} has the same members as {{first}}; use {{first}}, or derive one from the other.' },
  },
  createOnce(context) {
    let structs = new Set(['Schema.Struct'])
    let min = 2
    let seen = new Map<string, string>()

    const check = (node: ESTree.Node, name: string, kind: string, members: readonly ESTree.Node[]) => {
      if (members.length < min) {
        return
      }

      const signature = members
        .map((item) => context.sourceCode.getText(item).replaceAll(/\breadonly\s+/g, '').replaceAll(/\s+/g, '').replace(/[;,]$/, ''))
        .sort()
        .join(';')

      const key = `${kind}:${signature}`
      const first = seen.get(key)

      if (first === undefined) {
        seen.set(key, name)
        return
      }

      context.report({
        node,
        messageId: 'duplicate',
        data: { name, first },
      })
    }

    return {
      before() {
        const options = optionsFirst<TypesDuplicateOptions>(context, {})
        structs = new Set(options.structs ?? ['Schema.Struct'])
        min = options.min ?? 2
        seen = new Map()
      },
      TSInterfaceDeclaration(node) {
        const heritage = node.extends.map((item) => context.sourceCode.getText(item)).join(',')
        check(node, node.id.name, `type:${heritage}`, node.body.body)
      },
      TSTypeAliasDeclaration(node) {
        if (node.typeAnnotation.type === 'TSTypeLiteral') {
          check(node, node.id.name, 'type:', node.typeAnnotation.members)
        }
      },
      VariableDeclarator(node) {
        const init = node.init ? astUnwrap(node.init) : undefined
        const fields = init?.type === 'CallExpression' && structs.has(astDottedName(init.callee) ?? '') ? init.arguments[0] : undefined

        if (fields?.type === 'ObjectExpression' && node.id.type === 'Identifier') {
          check(node, node.id.name, 'struct', fields.properties)
        }
      },
    }
  },
})
