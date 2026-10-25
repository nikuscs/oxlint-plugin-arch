import { defineRule } from '@oxlint/plugins'
import { astDeclaration } from '../../utils/ast.utils.ts'
import { declarationsFunctionName } from '../../utils/declarations.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { FilesNoFunctionsOptions } from '../../types/files.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const filesNoFunctions = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          banReExports: { type: 'boolean' },
          allowPattern: optionsPatternSchema,
        },
      },
    ],
    defaultOptions: [{ banReExports: true }],
    messages: {
      noFunction: 'Files in this scope must not contain top-level function {{name}}.',
      noReExport: 'Files in this scope must not re-export values.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { banReExports, allowPattern } = optionsFirst<FilesNoFunctionsOptions>(context)
        const allowed = optionsPatterns(allowPattern)

        for (const statement of program.body) {
          const isReExport =
            statement.type === 'ExportAllDeclaration' || (statement.type === 'ExportNamedDeclaration' && Boolean(statement.source))

          if (banReExports && isReExport) {
            context.report({ node: statement, messageId: 'noReExport' })

            continue
          }

          const declaration =
            astDeclaration(statement)

          let functions: (ESTree.Function | ESTree.VariableDeclarator)[] = []

          if (declaration?.type === 'FunctionDeclaration') {
            functions = [declaration]
          } else if (declaration?.type === 'VariableDeclaration') {
            functions = declaration.declarations.filter(
              (item) => item.init?.type === 'FunctionExpression' || item.init?.type === 'ArrowFunctionExpression',
            )
          }

          for (const node of functions) {
            const name = declarationsFunctionName(node)

            if (!optionsPatternsTest(allowed, name)) {
              context.report({
                node,
                messageId: 'noFunction',
                data: { name },
              })
            }
          }
        }
      },
    }
  },
})
