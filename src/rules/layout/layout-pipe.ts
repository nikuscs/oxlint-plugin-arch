import { defineRule } from '@oxlint/plugins'
import { astIsCall, astIsOneLine, astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { LayoutPipeOptions } from '../../types/layout.types.ts'

export const layoutPipe = defineRule({
  meta: {
    type: 'layout',
    schema: [{ type: 'object', additionalProperties: false, properties: { methods: { type: 'array', items: { type: 'string' } } } }],
    messages: {
      after: 'No ).{{method}}( after a call that spans lines. Name the value and pipe the name, or pass the call to the step data-first.',
      step: 'A pipe step may span lines only through a callback, object or array. Name this call first, then pass the name.',
    },
  },
  createOnce(context) {
    let methods = new Set<string>()

    return {
      before() {
        methods = new Set(optionsFirst<LayoutPipeOptions>(context, {}).methods ?? ['pipe'])
      },
      CallExpression(node) {
        const callee = node.callee
        const piped = callee.type === 'MemberExpression' && methods.has(astMemberName(callee) ?? '')

        if (
          piped &&
          astIsCall(callee.object) &&
          !astIsOneLine(callee.object) &&
          callee.property.loc.start.line === callee.object.loc.end.line
        ) {
          context.report({
            node: callee.property,
            messageId: 'after',
            data: { method: astMemberName(callee) ?? 'pipe' },
          })
        }

        if (!piped) {
          return
        }

        for (const step of node.arguments) {
          for (const argument of astIsCall(step) ? step.arguments : []) {
            if (astIsCall(argument) && !astIsOneLine(argument)) {
              context.report({ node: argument, messageId: 'step' })
            }
          }
        }
      },
    }
  },
})
