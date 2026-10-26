import { defineRule } from '@oxlint/plugins'
import { astDeclaration } from '../../utils/ast.utils.ts'
import { declarationsIdName, declarationsIsFunctionValue } from '../../utils/declarations.utils.ts'
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
          reexports: { type: 'boolean' },
          allow: optionsPatternSchema,
        },
      },
    ],
    defaultOptions: [{ reexports: true }],
    messages: {
      noFunction: 'Files in this scope must not contain top-level function {{name}}.',
      noReExport: 'Files in this scope must not re-export values.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { reexports: banReExports, allow: allowPattern } = optionsFirst<FilesNoFunctionsOptions>(context)
        const allowed = optionsPatterns(allowPattern)

        for (const statement of program.body) {
          const isReExport =
            (statement.type === 'ExportAllDeclaration' && statement.exportKind !== 'type') ||
            (statement.type === 'ExportNamedDeclaration' && Boolean(statement.source) && statement.exportKind !== 'type' &&
              (statement.specifiers.length === 0 || statement.specifiers.some((specifier) => specifier.exportKind !== 'type')))

          if (banReExports && isReExport) {
            context.report({ node: statement, messageId: 'noReExport' })

            continue
          }

          const declaration = astDeclaration(statement)

          let functions: ESTree.Node[] = []

          if (declaration?.type === 'VariableDeclaration') {
            functions = declaration.declarations.filter((item) => declarationsIsFunctionValue(item.init))
          } else if (declaration?.type === 'FunctionDeclaration' || declarationsIsFunctionValue(declaration)) {
            functions = [declaration]
          }

          for (const node of functions) {
            const name = declarationsIdName(node) ?? '<anonymous>'

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
