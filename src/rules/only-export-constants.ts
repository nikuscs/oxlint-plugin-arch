import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface OnlyExportConstantsOptions {
  allowFunctionValues?: boolean
  allowTypeExports?: boolean
  allowReExports?: boolean
}

interface Binding {
  kind: 'const' | 'type' | 'import' | 'function' | 'class' | 'other'
  value?: ESTree.Expression | null
}

function bindingNames(pattern: ESTree.BindingPattern | ESTree.BindingRestElement): string[] {
  switch (pattern.type) {
    case 'Identifier':
      return [pattern.name]
    case 'AssignmentPattern':
      return bindingNames(pattern.left)
    case 'RestElement':
      return bindingNames(pattern.argument)
    case 'ArrayPattern':
      return pattern.elements.flatMap((element) => (element ? bindingNames(element) : []))
    case 'ObjectPattern':
      return pattern.properties.flatMap((property) =>
        bindingNames(property.type === 'RestElement' ? property : property.value),
      )
  }
}

function moduleName(node: ESTree.ModuleExportName): string {
  return node.type === 'Identifier' ? node.name : node.value
}

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

function collectBindings(program: ESTree.Program): Map<string, Binding> {
  const bindings = new Map<string, Binding>()

  for (const statement of program.body) {
    if (statement.type === 'ImportDeclaration') {
      for (const specifier of statement.specifiers) {
        bindings.set(specifier.local.name, {
          kind:
            statement.importKind === 'type' || (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
              ? 'type'
              : 'import',
        })
      }
      continue
    }

    const declaration =
      statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
        ? statement.declaration
        : statement

    if (declaration?.type === 'TSImportEqualsDeclaration') {
      bindings.set(declaration.id.name, { kind: declaration.importKind === 'type' ? 'type' : 'import' })
    } else if (declaration?.type === 'VariableDeclaration') {
      for (const item of declaration.declarations) {
        for (const name of bindingNames(item.id)) {
          bindings.set(name, {
            kind: declaration.kind === 'const' ? 'const' : 'other',
            value: item.id.type === 'Identifier' ? item.init : undefined,
          })
        }
      }
    } else if (declaration && 'id' in declaration && declaration.id?.type === 'Identifier') {
      bindings.set(declaration.id.name, {
        kind:
          declaration.type === 'TSTypeAliasDeclaration' || declaration.type === 'TSInterfaceDeclaration'
            ? 'type'
            : declaration.type === 'FunctionDeclaration' || declaration.type === 'TSDeclareFunction'
              ? 'function'
              : declaration.type === 'ClassDeclaration'
                ? 'class'
                : 'other',
      })
    }
  }

  return bindings
}

/**
 * Allows exports of local const bindings, not arbitrary expressions or mutable declarations.
 * Function values, type exports, and re-exports are separate opt-ins. Initializers are checked
 * syntactically (including local aliases), not evaluated or type-checked for deep immutability.
 *
 * Example: `const limit = 10; export { limit }` passes; `export let limit = 10` fails.
 */
export const onlyExportConstants = defineRule({
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
      nonConstant:
        "Export '{{name}}' must be a local const binding with an allowed value; types and re-exports require explicit options.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          allowFunctionValues = false,
          allowTypeExports = false,
          allowReExports = false,
        } = optionsFirst<OnlyExportConstantsOptions>(context, {})
        const bindings = collectBindings(program)

        function hasForbiddenValue(binding: Binding, seen = new Set<Binding>()): boolean {
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
          const allowed =
            typeOnly || (!reExport && binding?.kind === 'type')
              ? allowTypeExports
              : reExport || binding?.kind === 'import'
                ? allowReExports
                : binding?.kind === 'const' && !hasForbiddenValue(binding)

          if (!allowed) {
            context.report({ node, messageId: 'nonConstant', data: { name } })
          }
        }

        for (const statement of program.body) {
          if (statement.type === 'ExportAllDeclaration') {
            check(statement, '*', undefined, statement.exportKind === 'type', true)
          } else if (statement.type === 'ExportDefaultDeclaration') {
            const declaration = statement.declaration
            check(
              statement,
              'default',
              declaration.type === 'Identifier' ? declaration.name : undefined,
              declaration.type === 'TSInterfaceDeclaration',
            )
          } else if (statement.type === 'TSExportAssignment') {
            check(statement, 'export =')
          } else if (statement.type === 'TSNamespaceExportDeclaration') {
            check(statement, statement.id.name)
          } else if (statement.type === 'ExportNamedDeclaration') {
            const declaration = statement.declaration
            if (declaration?.type === 'VariableDeclaration') {
              for (const item of declaration.declarations) {
                for (const name of bindingNames(item.id)) {
                  check(item, name, name)
                }
              }
            } else if (declaration) {
              const name =
                'id' in declaration && declaration.id?.type === 'Identifier' ? declaration.id.name : '<anonymous>'
              check(declaration, name, name)
            }
            for (const specifier of statement.specifiers) {
              check(
                specifier,
                moduleName(specifier.exported),
                moduleName(specifier.local),
                statement.exportKind === 'type' || specifier.exportKind === 'type',
                Boolean(statement.source),
              )
            }
          }
        }
      },
    }
  },
})
