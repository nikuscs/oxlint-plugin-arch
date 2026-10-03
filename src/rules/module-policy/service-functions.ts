import { defineRule } from '@oxlint/plugins'
import {
  declarationsFileLevelFunctionCandidates,
  exportsCollectFunctions,
} from '../../utils/index.ts'

/** Keep one exported operation per service file; move a second helper into its own domain module. */
export const serviceFunctions = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      helper:
        'A service operation file owns one exported function. Move helpers to an explicit domain utility file.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const candidates = declarationsFileLevelFunctionCandidates(program)
        const exported = exportsCollectFunctions(program)
        for (const candidate of candidates) {
          if (
            candidates.length === 1 &&
            exported.some((entry) => entry.name === candidate.name)
          ) {
            continue
          }
          context.report({ node: candidate.node, messageId: 'helper' })
        }
      },
      FunctionDeclaration(node) {
        if (
          node.parent.type === 'Program' ||
          node.parent.type === 'ExportNamedDeclaration'
        ) {
          return
        }
        context.report({ node, messageId: 'helper' })
      },
      VariableDeclarator(node) {
        if (
          node.init?.type !== 'ArrowFunctionExpression' &&
          node.init?.type !== 'FunctionExpression'
        ) {
          return
        }
        if (
          node.parent.parent?.type === 'Program' ||
          node.parent.parent?.type === 'ExportNamedDeclaration'
        ) {
          return
        }
        context.report({ node, messageId: 'helper' })
      },
    }
  },
})
