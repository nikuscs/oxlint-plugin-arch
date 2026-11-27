import { defineRule } from '@oxlint/plugins'
import { astBindings } from '../../utils/ast.utils.ts'
import { declarationsIdName, declarationsKindOf } from '../../utils/declarations.utils.ts'
import { optionsFirst, optionsMessage, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { CommentsDocblockOptions } from '../../types/comments.types.ts'
import type { DeclarationsKind } from '../../types/declarations.types.ts'
import type { ESTree } from '@oxlint/plugins'

const commentsDocblockKinds: DeclarationsKind[] = ['function', 'const', 'let', 'var', 'class', 'type', 'interface', 'enum']

function commentsDocblockTarget(statement: ESTree.Program['body'][number]): ESTree.Node | null | undefined {
  if (statement.type === 'ExportNamedDeclaration') {
    return statement.declaration
  }

  return statement.type === 'ExportDefaultDeclaration' && (statement.declaration.type === 'FunctionDeclaration' || statement.declaration.type === 'ClassDeclaration')
    ? statement.declaration
    : undefined
}

function commentsDocblockNames(declaration: ESTree.Node): string[] {
  if (declaration.type === 'VariableDeclaration') {
    return declaration.declarations.flatMap((declarator) => astBindings(declarator.id).map((binding) => binding.name))
  }

  return [declarationsIdName(declaration) ?? 'default']
}

export const commentsDocblock = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          kinds: { type: 'array', items: { type: 'string', enum: commentsDocblockKinds }, minItems: 1 },
          names: optionsPatternSchema,
          message: { type: 'string' },
        },
      },
    ],
    messages: {
      missing: "Write a /** … */ docblock above '{{name}}'.{{message}}",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const options = optionsFirst<CommentsDocblockOptions>(context, {})
        const kinds = new Set<string>(options.kinds ?? commentsDocblockKinds)
        const names = optionsPatterns(options.names)
        const message = optionsMessage(options.message)
        const { sourceCode } = context
        const comments = sourceCode.getAllComments()
        let next = 0

        for (const statement of program.body) {
          while (next < comments.length && (comments[next]?.range[1] ?? Infinity) <= statement.range[0]) {
            next += 1
          }

          const declaration = commentsDocblockTarget(statement)
          const kind = declaration && (declaration.type === 'VariableDeclaration' ? declaration.kind : declarationsKindOf(declaration, []))
          const declared = declaration ? commentsDocblockNames(declaration) : []
          const name = names.length > 0 ? declared.find((item) => optionsPatternsTest(names, item)) : declared[0]

          if (!kind || !kinds.has(kind) || name === undefined) {
            continue
          }

          const comment = next > 0 ? comments[next - 1] : undefined
          const between = comment ? sourceCode.text.slice(comment.range[1], statement.range[0]) : ''

          if (comment?.type !== 'Block' || !comment.value.startsWith('*') || between.trim() !== '') {
            context.report({
              node: statement,
              messageId: 'missing',
              data: { name, message },
            })
          }
        }
      },
    }
  },
})
