import { defineRule } from '@oxlint/plugins'
import { astCallDepth, astIsCall, astIsInlineFunction, astIsOneLine, astMemberName, astSome } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import { sourceLineEnd, sourceLineStart } from '../../utils/source.utils.ts'
import type { AstCall } from '../../types/ast.types.ts'
import type { CodeInlineOptions } from '../../types/code.types.ts'
import type { ESTree } from '@oxlint/plugins'

function codeInlineIsData(node: ESTree.Node): boolean {
  return (
    node.type === 'ObjectExpression' ||
    node.type === 'ArrayExpression' ||
    ((node.type === 'TSSatisfiesExpression' || node.type === 'TSAsExpression') && codeInlineIsData(node.expression))
  )
}

function codeInlineOuterCall(node: ESTree.Node): AstCall | undefined {
  const parent = node.parent

  if (!parent || astIsInlineFunction(parent) || parent.type.endsWith('Statement')) {
    return undefined
  }

  return astIsCall(parent) && parent.arguments.some((argument) => argument === node) ? parent : codeInlineOuterCall(parent)
}

function codeInlineEnclosingCalls(node: ESTree.Node): number {
  const outer = codeInlineOuterCall(node)
  return outer && astIsOneLine(outer) ? 1 + codeInlineEnclosingCalls(outer) : 0
}

const codeInlineWrapped = new Set(['ConditionalExpression', 'LogicalExpression', 'BinaryExpression', 'ArrowFunctionExpression'])

export const codeInline = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          max: { type: 'integer', minimum: 1, default: 160 },
          nesting: { type: 'integer', minimum: 1, default: 2 },
          allow: optionsPatternSchema,
          keep: optionsPatternSchema,
          services: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
    messages: {
      once: '{{name}} is used once: inline it.',
      trivial: '{{name}} only wraps one call or expression: inline it at each use.',
    },
  },
  createOnce(context) {
    let options: CodeInlineOptions = {}
    let allowed: RegExp[] = []
    let kept: RegExp[] = []

    const reads = (node: ESTree.Node) => {
      const variable = context.sourceCode.getDeclaredVariables(node).at(0)
      return variable ? variable.references.filter((reference) => !reference.init) : []
    }

    const top = (node: ESTree.Node, id: ESTree.Node, init: ESTree.Node | null) => {
      if (id.type !== 'Identifier' || !astIsOneLine(node) || (init && codeInlineIsData(init)) || optionsPatternsTest(allowed, id.name)) {
        return
      }

      const uses = reads(node)

      if (uses.some((reference) => reference.identifier.parent.type === 'ExportSpecifier')) {
        return
      }

      if (uses.length === 1) {
        context.report({
          node: id,
          messageId: 'once',
          data: { name: id.name },
        })
        return
      }

      const arrow = init?.type === 'ArrowFunctionExpression' && init.body.type !== 'BlockStatement' && !astSome(init.body, astIsInlineFunction)
      const call = init?.type === 'CallExpression' && !astSome(init.arguments, astIsInlineFunction) && astCallDepth(init) <= 2

      if (!optionsPatternsTest(kept, id.name) && (arrow || call)) {
        context.report({
          node: id,
          messageId: 'trivial',
          data: { name: id.name },
        })
      }
    }

    const local = (declarator: ESTree.VariableDeclarator) => {
      const { id, init } = declarator
      const yields = (node: ESTree.Node) => node.type === 'YieldExpression'

      if (id.type !== 'Identifier' || !init || !astIsOneLine(declarator) || codeInlineIsData(init) || astSome(init, yields, (node) => !astIsInlineFunction(node))) {
        return
      }

      const uses = reads(declarator)
      const use = uses.at(0)?.identifier

      if (!use || uses.length > 1 || optionsPatternsTest(allowed, id.name)) {
        return
      }

      const text = context.sourceCode.text
      const line = text.slice(sourceLineStart(text, use.range[0]), sourceLineEnd(text, use.range[0]))
      const owner = use.parent.type === 'Property' ? use.parent.parent.parent : null
      const service = owner && astIsCall(owner) && owner.callee.type === 'MemberExpression' && (options.services ?? []).includes(astMemberName(owner.callee) ?? '')
      let deferred = false

      for (let current: ESTree.Node | null = use.parent; current && current !== declarator.parent.parent; current = current.parent) {
        deferred ||= current.type === 'FunctionDeclaration' || astIsInlineFunction(current)
      }

      const wrapped = codeInlineWrapped.has(init.type) && use.parent.type === 'MemberExpression' && use.parent.object === use

      if (
        service ||
        wrapped ||
        deferred ||
        codeInlineEnclosingCalls(use) + astCallDepth(init) > (options.nesting ?? 2) ||
        line.length - id.name.length + context.sourceCode.getText(init).length > (options.max ?? 160)
      ) {
        return
      }

      context.report({
        node: id,
        messageId: 'once',
        data: { name: id.name },
      })
    }

    return {
      before() {
        options = optionsFirst<CodeInlineOptions>(context, {})
        allowed = optionsPatterns(options.allow)
        kept = optionsPatterns(options.keep)
      },
      VariableDeclaration(node) {
        if (node.kind === 'const' && node.parent.type === 'BlockStatement') {
          node.declarations.forEach(local)
        }
      },
      Program(program) {
        for (const statement of program.body) {
          if (statement.type === 'VariableDeclaration' && statement.kind === 'const') {
            statement.declarations.forEach((declarator) => top(declarator, declarator.id, declarator.init))
          }

          if (statement.type === 'FunctionDeclaration' && statement.id) {
            top(statement, statement.id, null)
          }
        }
      },
    }
  },
})
