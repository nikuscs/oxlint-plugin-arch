import { defineRule } from '@oxlint/plugins'
import type { TypesImportedBinding } from '../../types/types.types.ts'
import type { ESTree } from '@oxlint/plugins'

function importedAliasTarget(declaration: ESTree.Node | null, imports: ReadonlyMap<string, TypesImportedBinding>): string | undefined {
  if (declaration?.type !== 'TSTypeAliasDeclaration') {
    return undefined
  }

  const type = declaration.typeAnnotation

  if (type.type !== 'TSTypeReference' || type.typeName.type !== 'Identifier' || type.typeArguments?.params.length) {
    return undefined
  }

  return imports.has(type.typeName.name) ? type.typeName.name : undefined
}

export const typesImportedAlias = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      alias: "Import '{{name}}' from '{{source}}' at the callers instead of exporting alias '{{alias}}'. Keep genuine derivations; do not substitute an empty interface.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const imports = new Map<string, TypesImportedBinding>()
        const aliases = new Map<string, string>()

        for (const statement of program.body) {
          if (statement.type !== 'ImportDeclaration') {
            continue
          }

          for (const specifier of statement.specifiers) {
            let name = specifier.local.name

            if (specifier.type === 'ImportSpecifier') {
              name = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value
            }
            imports.set(specifier.local.name, { name, source: statement.source.value })
          }
        }

        for (const statement of program.body) {
          const declaration = statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration' ? statement.declaration : statement
          const imported = importedAliasTarget(declaration, imports)

          if (declaration?.type === 'TSTypeAliasDeclaration' && imported) {
            aliases.set(declaration.id.name, imported)
          }
        }

        function report(node: ESTree.Node, alias: string, local: string) {
          const imported = imports.get(local)
          context.report({
            node,
            messageId: 'alias',
            data: { alias, name: imported?.name ?? local, source: imported?.source ?? '<import source>' },
          })
        }

        for (const statement of program.body) {
          if (statement.type !== 'ExportNamedDeclaration') {
            continue
          }

          const inline = importedAliasTarget(statement.declaration, imports)

          if (inline && statement.declaration?.type === 'TSTypeAliasDeclaration') {
            report(statement.declaration, statement.declaration.id.name, inline)
          }

          for (const specifier of statement.specifiers) {
            const local = specifier.local.type === 'Identifier' ? specifier.local.name : specifier.local.value
            const imported = aliases.get(local)

            if (imported) {
              report(specifier, local, imported)
            }
          }
        }
      },
    }
  },
})
