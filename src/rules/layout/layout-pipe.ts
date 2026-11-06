import { defineRule } from '@oxlint/plugins'
import { astIsCall, astIsOneLine, astIsPipe, astMemberName } from '../../utils/ast.utils.ts'

export const layoutPipe = defineRule({
  meta: {
    type: 'layout',
    messages: {
      after: 'No ).pipe( after a call that spans lines. Name the value and pipe the name, or pass the call to the step data-first.',
      step: 'A pipe step may span lines only through a callback, object or array. Name this call first, then pass the name.',
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const callee = node.callee

        if (
          callee.type === 'MemberExpression' &&
          astMemberName(callee) === 'pipe' &&
          astIsCall(callee.object) &&
          !astIsOneLine(callee.object) &&
          callee.property.loc.start.line === callee.object.loc.end.line
        ) {
          context.report({ node: callee.property, messageId: 'after' })
        }

        if (!astIsPipe(node)) {
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
