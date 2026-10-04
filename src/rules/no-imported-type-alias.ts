import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'

function importedAliasTarget(declaration: ESTree.Declaration | null, imports: Set<string>): string | undefined {
  if (declaration?.type !== 'TSTypeAliasDeclaration'
    || declaration.typeAnnotation.type !== 'TSTypeReference'
    || declaration.typeAnnotation.typeName.type !== 'Identifier'
    || Boolean(declaration.typeAnnotation.typeArguments?.params.length)
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
      alias: "Import '{{name}}' from '{{source}}' at the callers instead of exporting alias '{{alias}}'. Keep genuine derivations; do not substitute an empty interface.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const imports = new Set(program.body.flatMap((statement) => statement.type === 'ImportDeclaration'
          ? statement.specifiers.map((specifier) => specifier.local.name)
          : []))
        const origins = new Map(program.body.flatMap((statement) => statement.type === 'ImportDeclaration' ? statement.specifiers.map((specifier) => [specifier.local.name, { source: statement.source.value, name: specifier.type === 'ImportSpecifier' ? specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value : specifier.local.name }] as const) : []))
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
              data: { alias: statement.declaration.id.name, name: origins.get(inline)?.name ?? inline, source: origins.get(inline)?.source ?? '<import source>' },
            })
          }

          for (const specifier of statement.specifiers) {
            const local = specifierLocalName(specifier)
            const imported = aliases.get(local)

            if (imported) {
              context.report({
                node: specifier,
                messageId: 'alias',
                data: { alias: local, name: origins.get(imported)?.name ?? imported, source: origins.get(imported)?.source ?? '<import source>' },
              })
            }
          }
        }
      },
    }
  },
})
