import { defineRule } from '@oxlint/plugins'
import { commentsNormalizedValue, layoutNewline, optionsFirst } from '../utils/index.ts'
import type { ESTree, SourceCode } from '@oxlint/plugins'

interface PaddingBetweenStatementsOptions {
  returnMinStatements?: number
  multilineVariables?: boolean
}

type PaddingKind = 'variable' | 'block' | 'control' | 'return' | 'other'

function paddingKind(node: ESTree.Node): PaddingKind {
  if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
    return node.declaration ? paddingKind(node.declaration) : 'other'
  }

  switch (node.type) {
    case 'VariableDeclaration':
      return 'variable'
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
      return 'block'
    case 'IfStatement':
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'SwitchStatement':
    case 'TryStatement':
      return 'control'
    case 'ReturnStatement':
      return 'return'
    default:
      return 'other'
  }
}

function paddingHasBlankLine(gap: string): boolean {
  const lines = gap.split('\n')
  for (let index = 1; index < lines.length - 1; index++) {
    if (/^[\t\r ]*$/.test(lines[index])) {
      return true
    }
  }
  return false
}

function paddingBlankLineFix(
  sourceText: string,
  comments: readonly ESTree.Comment[],
  prev: ESTree.Node,
  curr: ESTree.Node,
  newline: string,
) {
  const gap = sourceText.slice(prev.range[1], curr.range[0])
  const match = /\r?\n/.exec(gap)
  if (!match) {
    return null
  }

  const newlineStart = prev.range[1] + match.index
  const newlineEnd = newlineStart + match[0].length
  // Why: inserting inside a spanning block comment would corrupt it; that gap is ambiguous.
  if (comments.some(comment => comment.range[0] < newlineEnd && comment.range[1] > newlineStart)) {
    return null
  }
  // Why: a blank line after this directive would disconnect it from the statement it suppresses.
  if (comments.some(comment =>
    comment.loc.start.line === prev.loc.end.line
    && /^\s*[A-Za-z][\w-]*-disable-next-line\b/.test(commentsNormalizedValue(comment)))) {
    return null
  }

  return { newlineEnd, newline }
}

/**
 * Requires a blank line around function/class declarations, between variables and control flow,
 * between consecutive control-flow statements, and before `return` in larger blocks.
 *
 * Example: `const n = 1\nfunction save() {}` fails; put a blank line between them.
 */
export const paddingBetweenStatements = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        returnMinStatements: { type: 'integer', minimum: 1, default: 3 },
        multilineVariables: { type: 'boolean' },
      },
    }],
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
    let source: SourceCode

    function checkStatements(statements: readonly ESTree.Node[]) {
      for (let index = 1; index < statements.length; index++) {
        const prev = statements[index - 1]
        const curr = statements[index]
        const gap = source.text.slice(prev.range[1], curr.range[0])
        // Why: loc-line math treats a comment line as a blank line; only a whitespace-only line counts.
        if (!/\r?\n/.test(gap) || paddingHasBlankLine(gap)) {
          continue
        }

        const prevKind = paddingKind(prev)
        const currKind = paddingKind(curr)
        const multiline = multilineVariables && ((prevKind === 'variable' && prev.loc.start.line !== prev.loc.end.line)
          || (currKind === 'variable' && curr.loc.start.line !== curr.loc.end.line))
        const messageId = multiline ? 'multilineVariable' : (prevKind === 'variable' && currKind === 'block') || (prevKind === 'block' && currKind === 'variable')
          ? 'variableAndBlock'
          : currKind === 'block'
            ? 'beforeBlock'
            : prevKind === 'block'
              ? 'afterBlock'
              : prevKind === 'variable' && currKind === 'control'
                ? 'variableAndControl'
                : prevKind === 'control' && currKind === 'variable'
                  ? 'controlAndVariable'
                  : prevKind === 'control' && currKind === 'control'
                    ? 'consecutiveControl'
                    : currKind === 'return' && prevKind !== 'variable' && statements.length >= returnMinStatements
                      ? 'beforeReturn'
                      : null

        if (!messageId) {
          continue
        }

        const comments = source.getCommentsAfter(prev).filter(comment => comment.range[1] <= curr.range[0])
        const insert = paddingBlankLineFix(source.text, comments, prev, curr, newline)
        context.report({
          node: curr,
          messageId,
          fix: insert
            ? fixer => fixer.insertTextAfterRange([insert.newlineEnd, insert.newlineEnd], insert.newline)
            : undefined,
        })
      }
    }

    return {
      before() {
        const options = optionsFirst<PaddingBetweenStatementsOptions>(context, {})
        returnMinStatements = options.returnMinStatements ?? 3
        multilineVariables = options.multilineVariables ?? false
        source = context.sourceCode
        newline = layoutNewline(source.text)
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
