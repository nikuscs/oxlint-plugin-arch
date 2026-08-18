import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'

function importedAliasTarget(declaration: ESTree.Declaration | null, imports: Set<string>): string | undefined {
  if (declaration?.type !== 'TSTypeAliasDeclaration'
    || declaration.typeAnnotation.type !== 'TSTypeReference'
    || declaration.typeAnnotation.typeName.type !== 'Identifier'
    || !imports.has(declaration.typeAnnotation.typeName.name)) {
    return undefined
  }

  return declaration.typeAnnotation.typeName.name
}

function specifierLocalName(specifier: ESTree.ExportSpecifier): string {
  return specifier.local.type === 'Identifier' ? specifier.local.name : specifier.local.value
}

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
        const aliases = new Map<string, string>()

        for (const statement of program.body) {
          const declaration = statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
            ? statement.declaration
            : statement
          const imported = declaration && declaration.type.endsWith('Declaration')
            ? importedAliasTarget(declaration as ESTree.Declaration, imports)
            : undefined

          if (declaration?.type === 'TSTypeAliasDeclaration' && imported) {
            aliases.set(declaration.id.name, imported)
          }
        }

        for (const statement of program.body) {
          if (statement.type !== 'ExportNamedDeclaration') {
            continue
          }

          const inline = importedAliasTarget(statement.declaration, imports)
          if (inline && statement.declaration?.type === 'TSTypeAliasDeclaration') {
            context.report({
              node: statement.declaration,
              messageId: 'alias',
              data: { alias: statement.declaration.id.name, name: inline },
            })
          }

          for (const specifier of statement.specifiers) {
            const local = specifierLocalName(specifier)
            const imported = aliases.get(local)

            if (imported) {
              context.report({
                node: specifier,
                messageId: 'alias',
                data: { alias: local, name: imported },
              })
            }
          }
        }
      },
    }
  },
})
