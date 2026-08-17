import { defineRule } from '@oxlint/plugins'
import {
  declarationsIsRuntime,
  declarationsRuntimeKind,
  declarationsRuntimeName,
  optionsFirst,
} from '../utils/index.ts'

interface NoRuntimeInTypesOptions {
  allow?: ('class' | 'default' | 'enum' | 'function' | 'variable')[]
}

/**
 * Keeps consumer-selected type modules free of runtime declarations, with optional declaration-category exceptions.
 *
 * Example: An interface passes; `export const value = 1` fails unless variables are allowed.
 */
export const noRuntimeInTypes = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        allow: {
          type: 'array',
          items: { type: 'string', enum: ['class', 'default', 'enum', 'function', 'variable'] },
        },
      },
    }],
    messages: {
      runtimeValue: 'Types files must not contain runtime value {{name}}.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { allow = [] } = optionsFirst<NoRuntimeInTypesOptions>(context, {})

        for (const statement of program.body) {
          const declaration = statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
            ? statement.declaration
            : statement

          if (!declaration) {
            continue
          }

          if (declarationsIsRuntime(declaration)) {
            if (!declaration.declare && !allow.includes(declarationsRuntimeKind(declaration))) {
              context.report({
                node: declaration,
                messageId: 'runtimeValue',
                data: { name: declarationsRuntimeName(declaration) },
              })
            }
            continue
          }

          if (!allow.includes('default') && statement.type === 'ExportDefaultDeclaration'
            && declaration.type !== 'TSInterfaceDeclaration' && declaration.type !== 'TSTypeAliasDeclaration') {
            context.report({
              node: statement,
              messageId: 'runtimeValue',
              data: { name: 'default' },
            })
          }
        }
      },
    }
  },
})
