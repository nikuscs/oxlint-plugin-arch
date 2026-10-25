import { defineRule } from '@oxlint/plugins'
import { astBindings, astDeclaration, astModuleName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { FilesConstantsOnlyBinding, FilesConstantsOnlyOptions } from '../../types/files.types.ts'
import type { ESTree } from '@oxlint/plugins'

function unwrap(expression: ESTree.Expression): ESTree.Expression {
  if (
    expression.type === 'ParenthesizedExpression' ||
    expression.type === 'TSAsExpression' ||
    expression.type === 'TSSatisfiesExpression' ||
    expression.type === 'TSTypeAssertion' ||
    expression.type === 'TSNonNullExpression' ||
    expression.type === 'TSInstantiationExpression'
  ) {
    return unwrap(expression.expression)
  }

  return expression
}

function declaredName(node: ESTree.Node): string | undefined {
  if (node.type === 'TSModuleDeclaration') {
    return node.id.type === 'Identifier' ? node.id.name : undefined
  }

  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'TSDeclareFunction' ||
    node.type === 'TSEmptyBodyFunctionExpression' ||
    node.type === 'ClassDeclaration' ||
    node.type === 'ClassExpression' ||
    node.type === 'TSEnumDeclaration' ||
    node.type === 'TSInterfaceDeclaration' ||
    node.type === 'TSTypeAliasDeclaration' ||
    node.type === 'TSImportEqualsDeclaration' ||
    node.type === 'TSNamespaceExportDeclaration'
  ) {
    return node.id?.name
  }

  return undefined
}

function collectBindings(program: ESTree.Program): Map<string, FilesConstantsOnlyBinding> {
  const bindings = new Map<string, FilesConstantsOnlyBinding>()

  for (const statement of program.body) {
    if (statement.type === 'ImportDeclaration') {
      for (const specifier of statement.specifiers) {
        const typeOnly = statement.importKind === 'type' || (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')

        bindings.set(specifier.local.name, { kind: typeOnly ? 'type' : 'import' })
      }

      continue
    }

    const declaration =
      astDeclaration(statement)

    if (declaration?.type === 'TSImportEqualsDeclaration') {
      bindings.set(declaration.id.name, { kind: declaration.importKind === 'type' ? 'type' : 'import' })
      continue
    }

    if (declaration?.type === 'VariableDeclaration') {
      for (const item of declaration.declarations) {
        const kind = declaration.kind === 'const' ? 'const' : 'other'
        const value = item.id.type === 'Identifier' ? item.init : undefined

        for (const { name } of astBindings(item.id)) {
          bindings.set(name, { kind, value })
        }
      }

      continue
    }

    const name = declaration ? declaredName(declaration) : undefined

    if (!declaration || !name) {
      continue
    }

    let kind: FilesConstantsOnlyBinding['kind'] = declaration.type === 'ClassDeclaration' ? 'class' : 'other'

    if (declaration.type === 'TSTypeAliasDeclaration' || declaration.type === 'TSInterfaceDeclaration') {
      kind = 'type'
    } else if (declaration.type === 'FunctionDeclaration' || declaration.type === 'TSDeclareFunction') {
      kind = 'function'
    }

    bindings.set(name, { kind })
  }

  return bindings
}

export const filesConstantsOnly = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowFunctionValues: { type: 'boolean' },
          allowTypeExports: { type: 'boolean' },
          allowReExports: { type: 'boolean' },
        },
      },
    ],
    messages: {
      nonConstant: "Export '{{name}}' must be a local const binding with an allowed value; types and re-exports require explicit options.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          allowFunctionValues = false,
          allowTypeExports = false,
          allowReExports = false,
        } = optionsFirst<FilesConstantsOnlyOptions>(context, {})

        const bindings = collectBindings(program)

        function hasForbiddenValue(binding: FilesConstantsOnlyBinding, seen = new Set<FilesConstantsOnlyBinding>()): boolean {
          if (seen.has(binding) || binding.kind === 'class') {
            return true
          }

          if (binding.kind === 'function') {
            return !allowFunctionValues
          }

          if (!binding.value) {
            return false
          }

          seen.add(binding)

          const value = unwrap(binding.value)

          if (value.type === 'ArrowFunctionExpression' || value.type === 'FunctionExpression') {
            return !allowFunctionValues
          }

          if (value.type === 'ClassExpression') {
            return true
          }

          const target = value.type === 'Identifier' ? bindings.get(value.name) : undefined

          return target ? hasForbiddenValue(target, seen) : false
        }

        function check(node: ESTree.Node, name: string, localName?: string, typeOnly = false, reExport = false) {
          const binding = localName ? bindings.get(localName) : undefined
          let allowed = allowReExports

          if (typeOnly || (!reExport && binding?.kind === 'type')) {
            allowed = allowTypeExports
          } else if (!reExport && binding?.kind !== 'import') {
            allowed = binding?.kind === 'const' && !hasForbiddenValue(binding)
          }

          if (!allowed) {
            context.report({
              node,
              messageId: 'nonConstant',
              data: { name },
            })
          }
        }

        for (const statement of program.body) {
          if (statement.type === 'ExportAllDeclaration') {
            check(statement, '*', undefined, statement.exportKind === 'type', true)
          } else if (statement.type === 'ExportDefaultDeclaration') {
            const declaration = statement.declaration
            const localName = declaration.type === 'Identifier' ? declaration.name : undefined

            check(statement, 'default', localName, declaration.type === 'TSInterfaceDeclaration')
          } else if (statement.type === 'TSExportAssignment') {
            check(statement, 'export =')
          } else if (statement.type === 'TSNamespaceExportDeclaration') {
            check(statement, statement.id.name)
          } else if (statement.type === 'ExportNamedDeclaration') {
            const declaration = statement.declaration

            if (declaration?.type === 'VariableDeclaration') {
              for (const item of declaration.declarations) {
                for (const { name } of astBindings(item.id)) {
                  check(item, name, name)
                }
              }
            } else if (declaration) {
              const name = declaredName(declaration) ?? '<anonymous>'

              check(declaration, name, name)
            }

            for (const specifier of statement.specifiers) {
              const typeOnly = statement.exportKind === 'type' || specifier.exportKind === 'type'

              check(specifier, astModuleName(specifier.exported), astModuleName(specifier.local), typeOnly, Boolean(statement.source))
            }
          }
        }
      },
    }
  },
})
