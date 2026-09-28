import { defineRule } from '@oxlint/plugins'
import {
  declarationsIsRuntime,
  declarationsRuntimeKind,
  declarationsRuntimeName,
  optionsFirst,
} from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface NoRuntimeInTypesOptions {
  allow?: ('class' | 'default' | 'enum' | 'function' | 'variable')[]
  runtimeImports?: 'allow' | 'ban'
  allowImportSources?: string[]
  banReExports?: boolean
}

function isTypeOnlyImport(statement: ESTree.ImportDeclaration): boolean {
  return statement.importKind === 'type' || statement.specifiers.length > 0
    && statement.specifiers.every((specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
}

function exportLocalName(specifier: ESTree.ExportSpecifier): string {
  return specifier.local.type === 'Identifier' ? specifier.local.name : specifier.local.value
}

function importEqualsSource(declaration: ESTree.TSImportEqualsDeclaration): string | undefined {
  return declaration.moduleReference.type === 'TSExternalModuleReference'
    ? declaration.moduleReference.expression.value
    : undefined
}

function importEqualsDeclaration(statement: ESTree.Statement): ESTree.TSImportEqualsDeclaration | undefined {
  if (statement.type === 'TSImportEqualsDeclaration') {
    return statement
  }

  return statement.type === 'ExportNamedDeclaration' && statement.declaration?.type === 'TSImportEqualsDeclaration'
    ? statement.declaration
    : undefined
}

function isAllowedSource(source: string, allowedImportSources: readonly RegExp[]): boolean {
  return allowedImportSources.some((pattern) => {
    pattern.lastIndex = 0
    return pattern.test(source)
  })
}

function runtimeInTypesIsAmbientFile(filename: string): boolean {
  return filename.endsWith('.d.ts') || filename.endsWith('.d.mts') || filename.endsWith('.d.cts')
}

function runtimeInTypesUnwrapped(statement: ESTree.Statement): ESTree.Node | undefined {
  return statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
    ? statement.declaration ?? undefined
    : statement
}

function runtimeInTypesEntityRootName(node: ESTree.Node): string | undefined {
  let current = node
  while (current.type === 'TSQualifiedName') {
    current = current.left
  }

  return current.type === 'Identifier' ? current.name : undefined
}

function importEqualsRootName(declaration: ESTree.TSImportEqualsDeclaration): string | undefined {
  return declaration.moduleReference.type === 'TSExternalModuleReference'
    ? undefined
    : runtimeInTypesEntityRootName(declaration.moduleReference)
}

function runtimeInTypesModuleBindingName(node: ESTree.Node): string | undefined {
  return node.type === 'TSModuleDeclaration' ? runtimeInTypesEntityRootName(node.id) : undefined
}

function runtimeInTypesIsInternalValueAlias(
  declaration: ESTree.TSImportEqualsDeclaration,
  valueNames: ReadonlySet<string>,
): boolean {
  if (declaration.importKind === 'type' || importEqualsSource(declaration) !== undefined) {
    return false
  }

  const root = importEqualsRootName(declaration)
  return root !== undefined && valueNames.has(root)
}

function runtimeInTypesModuleName(node: ESTree.Node): string {
  if (node.type !== 'TSModuleDeclaration') {
    return 'namespace'
  }

  return node.id.type === 'Identifier'
    ? node.id.name
    : node.id.type === 'Literal'
      ? String(node.id.value)
      : 'namespace'
}

function runtimeInTypesNamespaceIsRuntime(
  node: ESTree.Node,
  isAmbientFile: boolean,
  valueNames: ReadonlySet<string>,
): boolean {
  if (
    isAmbientFile || node.type !== 'TSModuleDeclaration' || node.declare || node.global || node.id.type === 'Literal'
    || !node.body
  ) {
    return false
  }

  return node.body.body.some((statement) => runtimeInTypesNamespaceMemberIsRuntime(statement, isAmbientFile, valueNames))
}

function runtimeInTypesNamespaceMemberIsRuntime(
  node: ESTree.Node,
  isAmbientFile: boolean,
  valueNames: ReadonlySet<string>,
): boolean {
  if (node.type === 'ExportNamedDeclaration') {
    if (node.exportKind === 'type') {
      return false
    }

    return node.declaration
      ? runtimeInTypesNamespaceMemberIsRuntime(node.declaration, isAmbientFile, valueNames)
      : node.specifiers.some((specifier) => specifier.exportKind !== 'type')
  }

  if (node.type === 'TSModuleDeclaration') {
    return runtimeInTypesNamespaceIsRuntime(node, isAmbientFile, valueNames)
  }

  if (node.type === 'TSImportEqualsDeclaration') {
    return node.importKind !== 'type'
      && (node.moduleReference.type === 'TSExternalModuleReference'
        || runtimeInTypesIsInternalValueAlias(node, valueNames))
  }

  if (node.type === 'TSExportAssignment') {
    return true
  }

  return declarationsIsRuntime(node) && !node.declare
}

function runtimeInTypesMemberHasValue(node: ESTree.Node): boolean {
  if (node.type === 'ExportNamedDeclaration') {
    if (node.exportKind === 'type') {
      return false
    }

    return node.declaration
      ? runtimeInTypesMemberHasValue(node.declaration)
      : node.specifiers.some((specifier) => specifier.exportKind !== 'type')
  }

  if (node.type === 'TSModuleDeclaration') {
    return runtimeInTypesNamespaceHasValueMembers(node)
  }

  if (node.type === 'TSImportEqualsDeclaration') {
    return node.importKind !== 'type' && node.moduleReference.type === 'TSExternalModuleReference'
  }

  if (node.type === 'TSExportAssignment') {
    return true
  }

  return declarationsIsRuntime(node)
}

function runtimeInTypesNamespaceHasValueMembers(node: ESTree.Node): boolean {
  if (node.type !== 'TSModuleDeclaration' || node.global || node.id.type === 'Literal' || !node.body) {
    return false
  }

  return node.body.body.some((statement) => runtimeInTypesMemberHasValue(statement))
}

function runtimeInTypesMemberReferencesValue(node: ESTree.Node, valueNames: ReadonlySet<string>): boolean {
  if (node.type === 'ExportNamedDeclaration') {
    return node.declaration ? runtimeInTypesMemberReferencesValue(node.declaration, valueNames) : false
  }

  if (node.type === 'TSModuleDeclaration') {
    return runtimeInTypesNamespaceHasValueMembers(node) || runtimeInTypesNamespaceReferencesValue(node, valueNames)
  }

  if (node.type === 'TSImportEqualsDeclaration') {
    return runtimeInTypesIsInternalValueAlias(node, valueNames)
  }

  return false
}

function runtimeInTypesNamespaceReferencesValue(node: ESTree.Node, valueNames: ReadonlySet<string>): boolean {
  if (node.type !== 'TSModuleDeclaration' || !node.body) {
    return false
  }

  return node.body.body.some((statement) => runtimeInTypesMemberReferencesValue(statement, valueNames))
}

function runtimeInTypesSeedValueName(declaration: ESTree.Node, valueNames: Set<string>): void {
  if (declaration.type === 'VariableDeclaration') {
    for (const item of declaration.declarations) {
      if (item.id.type === 'Identifier') {
        valueNames.add(item.id.name)
      }
    }
    return
  }

  if (
    (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration'
      || declaration.type === 'TSEnumDeclaration')
    && declaration.id
  ) {
    valueNames.add(declaration.id.name)
    return
  }

  if (declaration.type === 'TSModuleDeclaration') {
    const name = runtimeInTypesModuleBindingName(declaration)
    if (name && runtimeInTypesNamespaceHasValueMembers(declaration)) {
      valueNames.add(name)
    }
  }
}

function runtimeInTypesValueNames(statements: readonly ESTree.Statement[]): Set<string> {
  const valueNames = new Set<string>()

  for (const statement of statements) {
    if (statement.type === 'ImportDeclaration') {
      if (isTypeOnlyImport(statement)) {
        continue
      }

      for (const specifier of statement.specifiers) {
        if (specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type') {
          valueNames.add(specifier.local.name)
        }
      }
      continue
    }

    const importEquals = importEqualsDeclaration(statement)
    if (importEquals) {
      if (importEquals.importKind !== 'type' && importEqualsSource(importEquals) !== undefined) {
        valueNames.add(importEquals.id.name)
      }
      continue
    }

    const declaration = runtimeInTypesUnwrapped(statement)
    if (declaration) {
      runtimeInTypesSeedValueName(declaration, valueNames)
    }
  }

  let changed = true
  while (changed) {
    changed = false

    for (const statement of statements) {
      const importEquals = importEqualsDeclaration(statement)
      if (importEquals && runtimeInTypesIsInternalValueAlias(importEquals, valueNames)) {
        if (!valueNames.has(importEquals.id.name)) {
          valueNames.add(importEquals.id.name)
          changed = true
        }
        continue
      }

      const declaration = runtimeInTypesUnwrapped(statement)
      if (declaration?.type !== 'TSModuleDeclaration') {
        continue
      }

      const name = runtimeInTypesModuleBindingName(declaration)
      if (name && !valueNames.has(name) && runtimeInTypesNamespaceReferencesValue(declaration, valueNames)) {
        valueNames.add(name)
        changed = true
      }
    }
  }

  return valueNames
}

function runtimeInTypesExportAssignmentExpression(node: ESTree.TSExportAssignment): ESTree.Expression {
  let expression = node.expression
  while (expression.type === 'ParenthesizedExpression') {
    expression = expression.expression
  }

  return expression
}

function isRuntimeReExport(
  statement: ESTree.ExportNamedDeclaration | ESTree.ExportAllDeclaration,
  runtimeImportLocals: ReadonlySet<string>,
  valueNames: ReadonlySet<string>,
  isAmbientFile: boolean,
): boolean {
  if (statement.exportKind === 'type') {
    return false
  }

  if (statement.type === 'ExportAllDeclaration') {
    return true
  }

  if (statement.declaration?.type === 'TSImportEqualsDeclaration') {
    const declaration = statement.declaration
    if (declaration.importKind === 'type' || isAmbientFile) {
      return false
    }

    return importEqualsSource(declaration) !== undefined || runtimeInTypesIsInternalValueAlias(declaration, valueNames)
  }

  if (statement.source) {
    return statement.specifiers.length === 0
      || statement.specifiers.some((specifier) => specifier.exportKind !== 'type')
  }

  return statement.specifiers.some((specifier) => specifier.exportKind !== 'type'
    && runtimeImportLocals.has(exportLocalName(specifier)))
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
        runtimeImports: { type: 'string', enum: ['allow', 'ban'] },
        allowImportSources: { type: 'array', items: { type: 'string' } },
        banReExports: { type: 'boolean' },
      },
    }],
    messages: {
      runtimeValue: 'Types files must not contain runtime value {{name}}.',
      runtimeImport: 'Types files must not contain runtime imports from {{source}}.',
      runtimeReExport: 'Types files must not contain runtime re-exports.',
    },
  },
  createOnce(context) {
    let allow: NonNullable<NoRuntimeInTypesOptions['allow']> = []
    let runtimeImports: NonNullable<NoRuntimeInTypesOptions['runtimeImports']> = 'allow'
    let allowedImportSources: RegExp[] = []
    let banReExports = false
    let isAmbientFile = false

    return {
      before() {
        const options = optionsFirst<NoRuntimeInTypesOptions>(context, {})
        allow = options.allow ?? []
        runtimeImports = options.runtimeImports ?? 'allow'
        allowedImportSources = (options.allowImportSources ?? []).map((pattern) => new RegExp(pattern))
        banReExports = options.banReExports === true
        isAmbientFile = runtimeInTypesIsAmbientFile(context.filename)
      },
      Program(program) {
        const runtimeImportLocals = new Set<string>()
        const valueNames = runtimeInTypesValueNames(program.body)

        for (const statement of program.body) {
          if (statement.type === 'ImportDeclaration') {
            if (isTypeOnlyImport(statement)) {
              continue
            }

            for (const specifier of statement.specifiers) {
              if (specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type') {
                runtimeImportLocals.add(specifier.local.name)
              }
            }

            const source = String(statement.source.value)
            if (runtimeImports === 'ban' && !isAllowedSource(source, allowedImportSources)) {
              context.report({
                node: statement,
                messageId: 'runtimeImport',
                data: { source },
              })
            }
            continue
          }

          const declaration = importEqualsDeclaration(statement)
          if (!declaration || declaration.importKind === 'type') {
            continue
          }

          const source = importEqualsSource(declaration)
          if (source === undefined) {
            continue
          }

          runtimeImportLocals.add(declaration.id.name)
          if (runtimeImports === 'ban' && !isAllowedSource(source, allowedImportSources)) {
            context.report({
              node: declaration,
              messageId: 'runtimeImport',
              data: { source },
            })
          }
        }

        for (const statement of program.body) {
          if (banReExports && (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportAllDeclaration')
            && isRuntimeReExport(statement, runtimeImportLocals, valueNames, isAmbientFile)) {
            context.report({
              node: statement,
              messageId: 'runtimeReExport',
            })
          }

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

          if (declaration.type === 'TSModuleDeclaration') {
            if (runtimeInTypesNamespaceIsRuntime(declaration, isAmbientFile, valueNames)) {
              context.report({
                node: declaration,
                messageId: 'runtimeValue',
                data: { name: runtimeInTypesModuleName(declaration) },
              })
            }
            continue
          }

          if (statement.type === 'TSExportAssignment' && !allow.includes('default')) {
            const expression = runtimeInTypesExportAssignmentExpression(statement)
            if (expression.type !== 'Identifier' || valueNames.has(expression.name)) {
              context.report({
                node: statement,
                messageId: 'runtimeValue',
                data: { name: expression.type === 'Identifier' ? expression.name : 'default' },
              })
            }
            continue
          }

          const importEquals = importEqualsDeclaration(statement)
          if (!isAmbientFile && importEquals && runtimeInTypesIsInternalValueAlias(importEquals, valueNames)) {
            context.report({
              node: importEquals,
              messageId: 'runtimeValue',
              data: { name: importEquals.id.name },
            })
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
