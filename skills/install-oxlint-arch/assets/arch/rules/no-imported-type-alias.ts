import { defineRule } from '@oxlint/plugins'

/**
 * Rejects exported type aliases that merely rename an imported type without adding information.
 *
 * Example: `export type User = UserDto` fails when `UserDto` is imported; intersections and unions pass.
 */
export const noImportedTypeAlias = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      alias: "Exported type '{{alias}}' must not re-alias imported type '{{name}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const imports = new Set(program.body.flatMap((statement) => statement.type === 'ImportDeclaration'
          ? statement.specifiers.map((specifier) => specifier.local.name)
          : []))

        for (const statement of program.body) {
          const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : null

          if (declaration?.type !== 'TSTypeAliasDeclaration'
            || declaration.typeAnnotation.type !== 'TSTypeReference'
            || declaration.typeAnnotation.typeName.type !== 'Identifier'
            || !imports.has(declaration.typeAnnotation.typeName.name)) {
            continue
          }

          context.report({
            node: declaration,
            messageId: 'alias',
            data: {
              alias: declaration.id.name,
              name: declaration.typeAnnotation.typeName.name,
            },
          })
        }
      },
    }
  },
})
