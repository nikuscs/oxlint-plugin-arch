import { defineRule } from '@oxlint/plugins'
import { astBindings } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { CodeMutableStateOptions } from '../../types/code.types.ts'
import type { ESTree } from '@oxlint/plugins'

const functionScopes = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'TSDeclareFunction',
  'TSEmptyBodyFunctionExpression',
  'StaticBlock',
])

function hasAncestor(node: ESTree.Node, test: (ancestor: ESTree.Node) => boolean): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (test(current)) {
      return true
    }
  }
  return false
}

export const codeMutableState = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          kinds: {
            type: 'array',
            items: { type: 'string', enum: ['let', 'var'] },
          },
          allow: optionsPatternSchema,
        },
      },
    ],
    messages: {
      moduleState: 'module state is shared across requests/tests; keep it local.',
    },
  },
  createOnce(context) {
    let kinds = new Set<string>(['let', 'var'])
    let allowed: RegExp[] = []

    return {
      before() {
        const { kinds: configured = ['let', 'var'], allow: allowNamePattern } = optionsFirst<CodeMutableStateOptions>(
          context,
          {},
        )

        kinds = new Set(configured)
        allowed = optionsPatterns(allowNamePattern)
      },
      VariableDeclaration(node) {
        if (node.declare || !kinds.has(node.kind)) {
          return
        }

        const parent = node.parent
        const moduleLevel = parent.type === 'Program' || (parent.type === 'ExportNamedDeclaration' && parent.parent.type === 'Program')

        if (node.kind === 'let' && !moduleLevel) {
          return
        }

        if (node.kind === 'var' && hasAncestor(node, (ancestor) => functionScopes.has(ancestor.type))) {
          return
        }

        const ambient = hasAncestor(
          node,
          (ancestor) => ancestor.type === 'TSModuleDeclaration' && (ancestor.declare || ancestor.global || ancestor.id.type === 'Literal'),
        )

        if (ambient) {
          return
        }

        for (const declarator of node.declarations) {
          for (const identifier of astBindings(declarator.id)) {
            if (!optionsPatternsTest(allowed, identifier.name)) {
              context.report({ node: identifier, messageId: 'moduleState' })
            }
          }
        }
      },
    }
  },
})
