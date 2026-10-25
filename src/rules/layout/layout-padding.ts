import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import { sourceCommentText, sourceNewline } from '../../utils/source.utils.ts'
import type { LayoutPaddingKind, LayoutPaddingOptions } from '../../types/layout.types.ts'
import type { ESTree } from '@oxlint/plugins'

const layoutPaddingControl = new Set([
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'SwitchStatement',
  'TryStatement',
])

function layoutPaddingKind(node: ESTree.Node): LayoutPaddingKind {
  if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
    return node.declaration ? layoutPaddingKind(node.declaration) : 'other'
  }

  if (node.type === 'VariableDeclaration') {
    return 'variable'
  }

  if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
    return 'block'
  }

  if (layoutPaddingControl.has(node.type)) {
    return 'control'
  }

  return node.type === 'ReturnStatement' ? 'return' : 'other'
}

function layoutPaddingIsMultilineVariable(node: ESTree.Node, kind: LayoutPaddingKind): boolean {
  return kind === 'variable' && node.loc.start.line !== node.loc.end.line
}

export const layoutPadding = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          min: { type: 'integer', minimum: 1, default: 3 },
          multiline: { type: 'boolean' },
        },
      },
    ],
    messages: {
      variableAndBlock: 'Expected a blank line between a variable declaration and a function/class.',
      beforeBlock: 'Expected a blank line before a function/class declaration.',
      afterBlock: 'Expected a blank line after a function/class declaration.',
      variableAndControl: 'Expected a blank line between a variable declaration and control flow.',
      controlAndVariable: 'Expected a blank line between control flow and a variable declaration.',
      consecutiveControl: 'Expected a blank line between control flow statements.',
      beforeReturn: 'Expected a blank line before return statement.',
      multilineVariable: 'Expected a blank line around a multiline variable declaration.',
    },
  },
  createOnce(context) {
    let returnMinStatements = 3
    let multilineVariables = false
    let newline = '\n'

    function checkStatements(statements: readonly ESTree.Node[]) {
      const source = context.sourceCode
      const blankLine = newline

      for (let index = 1; index < statements.length; index++) {
        const previous = statements[index - 1]
        const current = statements[index]
        const gap = source.text.slice(previous.range[1], current.range[0])
        const match = /\r?\n/.exec(gap)

        if (!match || gap.split('\n').slice(1, -1).some((line) => /^[\t\r ]*$/.test(line))) {
          continue
        }

        const previousKind = layoutPaddingKind(previous)
        const currentKind = layoutPaddingKind(current)

        const multiline =
          multilineVariables &&
          (layoutPaddingIsMultilineVariable(previous, previousKind) || layoutPaddingIsMultilineVariable(current, currentKind))

        const messageIds: [boolean, string][] = [
          [multiline, 'multilineVariable'],
          [(previousKind === 'variable' && currentKind === 'block') || (previousKind === 'block' && currentKind === 'variable'), 'variableAndBlock'],
          [currentKind === 'block', 'beforeBlock'],
          [previousKind === 'block', 'afterBlock'],
          [previousKind === 'variable' && currentKind === 'control', 'variableAndControl'],
          [previousKind === 'control' && currentKind === 'variable', 'controlAndVariable'],
          [previousKind === 'control' && currentKind === 'control', 'consecutiveControl'],
          [currentKind === 'return' && previousKind !== 'variable' && statements.length >= returnMinStatements, 'beforeReturn'],
        ]

        const messageId = messageIds.find(([matches]) => matches)?.[1]

        if (!messageId) {
          continue
        }

        const comments = source.getCommentsAfter(previous).filter((comment) => comment.range[1] <= current.range[0])
        const newlineStart = previous.range[1] + match.index
        const newlineEnd = newlineStart + match[0].length
        const splitsComment = comments.some((comment) => comment.range[0] < newlineEnd && comment.range[1] > newlineStart)

        const endsWithDisableNextLine = comments.some(
          (comment) =>
            comment.loc.start.line === previous.loc.end.line &&
            /^\s*[A-Za-z][\w-]*-disable-next-line\b/.test(sourceCommentText(comment)),
        )

        context.report({
          node: current,
          messageId,
          fix: splitsComment || endsWithDisableNextLine ? undefined : (fixer) => fixer.insertTextAfterRange([newlineEnd, newlineEnd], blankLine),
        })
      }
    }

    return {
      before() {
        const options = optionsFirst<LayoutPaddingOptions>(context, {})
        returnMinStatements = options.min ?? 3
        multilineVariables = options.multiline ?? false
        newline = sourceNewline(context.sourceCode.text)
      },
      Program(node) {
        checkStatements(node.body)
      },
      BlockStatement(node) {
        checkStatements(node.body)
      },
    }
  },
})
