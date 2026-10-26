import { defineRule } from '@oxlint/plugins'
import { astDeclaration, astIsTypeOnlyImport, astModuleName } from '../../utils/ast.utils.ts'
import { declarationsIsRuntime } from '../../utils/declarations.utils.ts'
import { optionsFirst, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { DeclarationsRuntime } from '../../types/declarations.types.ts'
import type { FilesTypesOnlyAllow, FilesTypesOnlyImport, FilesTypesOnlyOptions } from '../../types/files.types.ts'
import type { ESTree } from '@oxlint/plugins'

function runtimeImportLocalNames(statement: ESTree.ImportDeclaration): string[] {
  return statement.specifiers.flatMap((specifier) =>
    specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type' ? [specifier.local.name] : [],
  )
}

function importEqualsSource(declaration: ESTree.TSImportEqualsDeclaration): string | undefined {
  return declaration.moduleReference.type === 'TSExternalModuleReference' ? declaration.moduleReference.expression.value : undefined
}

function importEqualsOf(statement: ESTree.Statement): ESTree.TSImportEqualsDeclaration | undefined {
  if (statement.type === 'TSImportEqualsDeclaration') {
    return statement
  }

  return statement.type === 'ExportNamedDeclaration' && statement.declaration?.type === 'TSImportEqualsDeclaration'
    ? statement.declaration
    : undefined
}

function entityRootName(node: ESTree.Node): string | undefined {
  let current = node

  while (current.type === 'TSQualifiedName') {
    current = current.left
  }

  return current.type === 'Identifier' ? current.name : undefined
}

function moduleBindingName(node: ESTree.Node): string | undefined {
  return node.type === 'TSModuleDeclaration' ? entityRootName(node.id) : undefined
}

function isInternalValueAlias(declaration: ESTree.TSImportEqualsDeclaration, valueNames: ReadonlySet<string>): boolean {
  if (declaration.importKind === 'type' || declaration.moduleReference.type === 'TSExternalModuleReference') {
    return false
  }

  const root = entityRootName(declaration.moduleReference)

  return root !== undefined && valueNames.has(root)
}

function namespaceIsRuntime(node: ESTree.Node, valueNames: ReadonlySet<string> | null): boolean {
  if (node.type !== 'TSModuleDeclaration' || node.global || node.id.type === 'Literal' || !node.body) {
    return false
  }

  if (valueNames && node.declare) {
    return false
  }

  return node.body.body.some((statement) => memberIsRuntime(statement, valueNames))
}

function memberIsRuntime(node: ESTree.Node, valueNames: ReadonlySet<string> | null): boolean {
  if (node.type === 'ExportNamedDeclaration') {
    if (node.exportKind === 'type') {
      return false
    }

    return node.declaration
      ? memberIsRuntime(node.declaration, valueNames)
      : node.specifiers.some((specifier) => specifier.exportKind !== 'type')
  }

  if (node.type === 'TSModuleDeclaration') {
    return namespaceIsRuntime(node, valueNames)
  }

  if (node.type === 'TSImportEqualsDeclaration') {
    return (
      node.importKind !== 'type' &&
      (node.moduleReference.type === 'TSExternalModuleReference' || (valueNames !== null && isInternalValueAlias(node, valueNames)))
    )
  }

  if (node.type === 'TSExportAssignment') {
    return true
  }

  return declarationsIsRuntime(node) && !(valueNames && node.declare)
}

function memberReferencesValue(node: ESTree.Node, valueNames: ReadonlySet<string>): boolean {
  if (node.type === 'ExportNamedDeclaration') {
    return node.declaration ? memberReferencesValue(node.declaration, valueNames) : false
  }

  if (node.type === 'TSModuleDeclaration') {
    return namespaceIsRuntime(node, null) || namespaceReferencesValue(node, valueNames)
  }

  return node.type === 'TSImportEqualsDeclaration' && isInternalValueAlias(node, valueNames)
}

function namespaceReferencesValue(node: ESTree.Node, valueNames: ReadonlySet<string>): boolean {
  if (node.type !== 'TSModuleDeclaration' || !node.body) {
    return false
  }

  return node.body.body.some((statement) => memberReferencesValue(statement, valueNames))
}

function addReferencingValueNames(statements: readonly ESTree.Statement[], valueNames: Set<string>): boolean {
  let changed = false

  for (const statement of statements) {
    const importEquals = importEqualsOf(statement)

    if (importEquals && isInternalValueAlias(importEquals, valueNames)) {
      if (!valueNames.has(importEquals.id.name)) {
        valueNames.add(importEquals.id.name)
        changed = true
      }

      continue
    }

    const declaration = astDeclaration(statement)
    const name = declaration ? moduleBindingName(declaration) : undefined

    if (declaration && name && !valueNames.has(name) && namespaceReferencesValue(declaration, valueNames)) {
      valueNames.add(name)
      changed = true
    }
  }

  return changed
}

function collectValueNames(statements: readonly ESTree.Statement[]): Set<string> {
  const valueNames = new Set<string>()

  for (const statement of statements) {
    if (statement.type === 'ImportDeclaration') {
      if (!astIsTypeOnlyImport(statement)) {
        for (const name of runtimeImportLocalNames(statement)) {
          valueNames.add(name)
        }
      }

      continue
    }

    const importEquals = importEqualsOf(statement)

    if (importEquals) {
      if (importEquals.importKind !== 'type' && importEqualsSource(importEquals) !== undefined) {
        valueNames.add(importEquals.id.name)
      }

      continue
    }

    const declaration = astDeclaration(statement)

    if (declaration?.type === 'VariableDeclaration') {
      for (const item of declaration.declarations) {
        if (item.id.type === 'Identifier') {
          valueNames.add(item.id.name)
        }
      }

      continue
    }

    const named = declaration?.type === 'FunctionDeclaration' || declaration?.type === 'ClassDeclaration' || declaration?.type === 'TSEnumDeclaration'

    if (named && declaration.id) {
      valueNames.add(declaration.id.name)

      continue
    }

    const name = declaration ? moduleBindingName(declaration) : undefined

    if (declaration && name && namespaceIsRuntime(declaration, null)) {
      valueNames.add(name)
    }
  }

  let changed = true

  while (changed) {
    changed = addReferencingValueNames(statements, valueNames)
  }

  return valueNames
}

function isRuntimeReExport(
  statement: ESTree.ExportNamedDeclaration | ESTree.ExportAllDeclaration,
  runtimeImportLocals: ReadonlySet<string>,
  valueNames: ReadonlySet<string>,
  ambient: boolean,
): boolean {
  if (statement.exportKind === 'type') {
    return false
  }

  if (statement.type === 'ExportAllDeclaration') {
    return true
  }

  const declaration = statement.declaration

  if (declaration?.type === 'TSImportEqualsDeclaration') {
    if (declaration.importKind === 'type' || ambient) {
      return false
    }

    return importEqualsSource(declaration) !== undefined || isInternalValueAlias(declaration, valueNames)
  }

  if (statement.source) {
    return statement.specifiers.length === 0 || statement.specifiers.some((specifier) => specifier.exportKind !== 'type')
  }

  return statement.specifiers.some((specifier) => specifier.exportKind !== 'type' && runtimeImportLocals.has(astModuleName(specifier.local)))
}

function runtimeName(node: DeclarationsRuntime): string {
  if (node.type === 'VariableDeclaration') {
    return node.declarations.map((item) => (item.id.type === 'Identifier' ? item.id.name : '<anonymous>')).join(', ')
  }
  return node.id?.name ?? '<anonymous>'
}

function runtimeKind(node: DeclarationsRuntime): FilesTypesOnlyAllow {
  if (node.type === 'ClassDeclaration') {
    return 'class'
  }

  if (node.type === 'TSEnumDeclaration') {
    return 'enum'
  }

  return node.type === 'FunctionDeclaration' ? 'function' : 'variable'
}

export const filesTypesOnly = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: {
            type: 'array',
            items: { type: 'string', enum: ['class', 'default', 'enum', 'function', 'variable'] },
          },
          imports: { type: 'string', enum: ['allow', 'ban'] },
          sources: { type: 'array', items: { type: 'string' } },
          reexports: { type: 'boolean' },
        },
      },
    ],
    messages: {
      runtimeValue: 'Types files must not contain runtime value {{name}}.',
      runtimeImport: 'Types files must not contain runtime imports from {{source}}.',
      runtimeReExport: 'Types files must not contain runtime re-exports.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const options = optionsFirst<FilesTypesOnlyOptions>(context, {})
        const allow = options.allow ?? []
        const banImports = options.imports === 'ban'
        const allowedSources = (options.sources ?? []).map((pattern) => new RegExp(pattern))
        const ambient = /\.d\.[cm]?ts$/.test(context.filename)
        const runtimeImportLocals = new Set<string>()
        const valueNames = collectValueNames(program.body)

        function reportValue(node: ESTree.Node, name: string) {
          context.report({
            node,
            messageId: 'runtimeValue',
            data: { name },
          })
        }

        const imports = program.body.flatMap((statement): FilesTypesOnlyImport[] => {
          if (statement.type === 'ImportDeclaration') {
            return astIsTypeOnlyImport(statement) ? [] : [{ node: statement, source: statement.source.value, locals: runtimeImportLocalNames(statement) }]
          }

          const declaration = importEqualsOf(statement)
          const source = declaration && declaration.importKind !== 'type' ? importEqualsSource(declaration) : undefined

          return declaration && source !== undefined ? [{ node: declaration, source, locals: [declaration.id.name] }] : []
        })

        for (const { node, source, locals } of imports) {
          for (const name of locals) {
            runtimeImportLocals.add(name)
          }

          if (banImports && !optionsPatternsTest(allowedSources, source)) {
            context.report({
              node,
              messageId: 'runtimeImport',
              data: { source },
            })
          }
        }

        for (const statement of program.body) {
          if (
            options.reexports === true &&
            (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportAllDeclaration') &&
            isRuntimeReExport(statement, runtimeImportLocals, valueNames, ambient)
          ) {
            context.report({ node: statement, messageId: 'runtimeReExport' })
          }

          const declaration = astDeclaration(statement)

          if (!declaration) {
            continue
          }

          if (declarationsIsRuntime(declaration)) {
            if (!declaration.declare && !allow.includes(runtimeKind(declaration))) {
              reportValue(declaration, runtimeName(declaration))
            }

            continue
          }

          if (declaration.type === 'TSModuleDeclaration') {
            if (!ambient && namespaceIsRuntime(declaration, valueNames)) {
              reportValue(declaration, declaration.id.type === 'Identifier' ? declaration.id.name : 'namespace')
            }

            continue
          }

          if (statement.type === 'TSExportAssignment' && !allow.includes('default')) {
            let expression = statement.expression

            while (expression.type === 'ParenthesizedExpression') {
              expression = expression.expression
            }

            if (expression.type !== 'Identifier') {
              reportValue(statement, 'default')
            } else if (valueNames.has(expression.name)) {
              reportValue(statement, expression.name)
            }

            continue
          }

          const importEquals = importEqualsOf(statement)

          if (!ambient && importEquals && isInternalValueAlias(importEquals, valueNames)) {
            reportValue(importEquals, importEquals.id.name)

            continue
          }

          if (
            !allow.includes('default') &&
            statement.type === 'ExportDefaultDeclaration' &&
            declaration.type !== 'TSInterfaceDeclaration' &&
            declaration.type !== 'TSTypeAliasDeclaration'
          ) {
            reportValue(statement, 'default')
          }
        }
      },
    }
  },
})
