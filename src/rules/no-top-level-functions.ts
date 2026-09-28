import { defineRule } from '@oxlint/plugins'
import { declarationsFunctionName, optionsFirst, optionsOptionalPatterns, optionsPatternSchema, optionsPatternsTest } from '../utils/index.ts'
import type { OptionsPattern } from '../utils/index.ts'

interface NoTopLevelFunctionsOptions {
  banReExports: boolean
  allowPattern?: OptionsPattern
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
        allowPattern: optionsPatternSchema,
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
        const allowed = optionsOptionalPatterns(allowPattern)

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
            if (!optionsPatternsTest(allowed, declarationsFunctionName(declaration))) {
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
              && !optionsPatternsTest(allowed, declarationsFunctionName(item))) {
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
