import { defineRule } from '@oxlint/plugins'
import { declarationsFunctionName, optionsFirst } from '../utils/index.ts'

interface NoTopLevelFunctionsOptions {
  banReExports: boolean
  allowPattern?: string
}

/**
 * Rejects top-level functions and function-valued variables, and can also reject re-exports.
 *
 * Example: A data-only constants file passes; `export const load = () => 1` fails.
 */
export const noTopLevelFunctions = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        banReExports: { type: 'boolean' },
        allowPattern: { type: 'string' },
      },
    }],
    defaultOptions: [{ banReExports: true }],
    messages: {
      noFunction: 'Files in this scope must not contain top-level function {{name}}.',
      noReExport: 'Files in this scope must not re-export values.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { banReExports, allowPattern } = optionsFirst<NoTopLevelFunctionsOptions>(context)
        const allowed = allowPattern ? new RegExp(allowPattern) : null

        for (const statement of program.body) {
          if (banReExports && (statement.type === 'ExportAllDeclaration'
            || (statement.type === 'ExportNamedDeclaration' && statement.source))) {
            context.report({ node: statement, messageId: 'noReExport' })
            continue
          }

          const declaration = statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
            ? statement.declaration
            : statement

          if (declaration?.type === 'FunctionDeclaration') {
            if (!allowed?.test(declarationsFunctionName(declaration))) {
              context.report({
                node: declaration,
                messageId: 'noFunction',
                data: { name: declarationsFunctionName(declaration) },
              })
            }
            continue
          }

          if (declaration?.type !== 'VariableDeclaration') {
            continue
          }

          for (const item of declaration.declarations) {
            if ((item.init?.type === 'FunctionExpression' || item.init?.type === 'ArrowFunctionExpression')
              && !allowed?.test(declarationsFunctionName(item))) {
              context.report({
                node: item,
                messageId: 'noFunction',
                data: { name: declarationsFunctionName(item) },
              })
            }
          }
        }
      },
    }
  },
})
