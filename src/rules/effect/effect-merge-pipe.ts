import { defineRule } from '@oxlint/plugins'
import { astDottedName, astIsOneLine, astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { EffectMergePipeOptions } from '../../types/effect.types.ts'
import type { ESTree } from '@oxlint/plugins'

const effectMergePipeDefaultMerge = ['Layer.mergeAll']

const effectMergePipeDefaultPipe = ['pipe', 'Function.pipe']

const effectMergePipeDefaultMethods = ['pipe']

export const effectMergePipe = defineRule({
  meta: {
    type: 'layout',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          merge: { type: 'array', items: { type: 'string' } },
          pipe: { type: 'array', items: { type: 'string' } },
          methods: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
    messages: {
      piped: 'A merge that spans lines is never piped. Name it first, then pipe the name.',
    },
  },
  createOnce(context) {
    let merge = new Set(effectMergePipeDefaultMerge)
    let pipe = new Set(effectMergePipeDefaultPipe)
    let methods = new Set(effectMergePipeDefaultMethods)

    const isMultilineMerge = (node: ESTree.Node | undefined) =>
      node?.type === 'CallExpression' && merge.has(astDottedName(node.callee) ?? '') && !astIsOneLine(node)

    return {
      before() {
        const options = optionsFirst<EffectMergePipeOptions>(context, {})
        merge = new Set(options.merge ?? effectMergePipeDefaultMerge)
        pipe = new Set(options.pipe ?? effectMergePipeDefaultPipe)
        methods = new Set(options.methods ?? effectMergePipeDefaultMethods)
      },
      CallExpression(node) {
        const callee = node.callee
        const first = node.arguments.at(0)

        if (callee.type === 'MemberExpression' && methods.has(astMemberName(callee) ?? '') && isMultilineMerge(callee.object)) {
          context.report({ node: callee.property, messageId: 'piped' })
        }

        if (pipe.has(astDottedName(callee) ?? '') && first !== undefined && isMultilineMerge(first)) {
          context.report({ node: first, messageId: 'piped' })
        }
      },
    }
  },
})
