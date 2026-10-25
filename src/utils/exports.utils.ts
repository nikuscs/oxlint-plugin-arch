import { astModuleName } from './ast.utils.ts'
import {
  declarationsIsFunctionValue,
  declarationsIsRuntime,
  declarationsPublicServiceMethods,
  declarationsTopLevelUnexportedFunctions,
  declarationsUnique,
} from './declarations.utils.ts'
import { optionsPatternsTest } from './options.utils.ts'
import type * as DeclarationsTypes from '../types/declarations.types.ts'
import type { ExportsBinding } from '../types/exports.types.ts'
import type { ESTree } from '@oxlint/plugins'

function exportsIsDeclaration(node: ESTree.Node): node is ESTree.Declaration {
  return (
    declarationsIsRuntime(node) ||
    node.type === 'TSTypeAliasDeclaration' ||
    node.type === 'TSInterfaceDeclaration' ||
    node.type === 'TSModuleDeclaration' ||
    node.type === 'TSImportEqualsDeclaration'
  )
}

function exportsBindings(declaration: ESTree.Declaration | null): ExportsBinding[] {
  if (!declaration || declaration.type === 'TSModuleDeclaration') {
    return []
  }

  if (declaration.type === 'VariableDeclaration') {
    return declaration.declarations.map((item) => ({
      exportedName: item.id.type === 'Identifier' ? item.id.name : '<anonymous>',
      localName: item.id.type === 'Identifier' ? item.id.name : undefined,
      node: declaration,
      declaration,
      initializer: item.init,
      typeOnly: false,
      default: false,
      reExport: false,
    }))
  }

  return [
    {
      exportedName: declaration.id?.name ?? '<anonymous>',
      localName: declaration.id?.name,
      node: declaration,
      declaration,
      typeOnly: declaration.type === 'TSInterfaceDeclaration' ||
        declaration.type === 'TSTypeAliasDeclaration' ||
        declaration.type === 'TSDeclareFunction',
      default: false,
      reExport: false,
    },
  ]
}

function exportsDefault(node: ESTree.Node): ExportsBinding {
  return { exportedName: 'default', node, typeOnly: false, default: true, reExport: false }
}

export function exportsCollect(program: ESTree.Program): ExportsBinding[] {
  const locals = new Map<string, ExportsBinding>()

  for (const statement of program.body) {
    if (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration' || !exportsIsDeclaration(statement)) {
      continue
    }

    for (const binding of exportsBindings(statement)) {
      if (binding.localName) {
        locals.set(binding.localName, binding)
      }
    }
  }

  return program.body.flatMap((statement): ExportsBinding[] => {
    if (statement.type === 'ExportAllDeclaration') {
      return [
        {
          exportedName: '*',
          node: statement,
          typeOnly: statement.exportKind === 'type',
          default: false,
          reExport: true,
        },
      ]
    }

    if (statement.type === 'ExportDefaultDeclaration') {
      const declaration = statement.declaration

      if (declaration.type === 'Identifier') {
        const local = locals.get(declaration.name)
        return [
          {
            ...(local ?? exportsDefault(statement)),
            exportedName: 'default',
            localName: local?.localName ?? declaration.name,
            default: true,
          },
        ]
      }

      if (exportsIsDeclaration(declaration)) {
        const bindings = exportsBindings(declaration)
        return bindings.length > 0
          ? bindings.map((binding) => ({ ...binding, exportedName: 'default', default: true }))
          : [exportsDefault(statement)]
      }

      return [exportsDefault(statement)]
    }

    if (statement.type !== 'ExportNamedDeclaration') {
      return []
    }

    return [
      ...exportsBindings(statement.declaration),
      ...statement.specifiers.map((specifier) => {
        const localName = astModuleName(specifier.local)
        const exportedName = astModuleName(specifier.exported)
        const local = locals.get(localName)
        return {
          ...(local ?? {
            exportedName,
            node: specifier,
            typeOnly: false,
            default: false,
            reExport: Boolean(statement.source),
          }),
          exportedName,
          localName,
          node: local?.node ?? specifier,
          typeOnly: specifier.exportKind === 'type' || statement.exportKind === 'type' || Boolean(local?.typeOnly),
          default: exportedName === 'default',
          reExport: Boolean(statement.source),
        }
      }),
    ]
  })
}

export function exportsFunctions(program: ESTree.Program): DeclarationsTypes.DeclarationsFunction[] {
  return exportsCollect(program).flatMap((binding) => {
    const name = binding.localName ?? binding.exportedName

    if (binding.declaration?.type === 'FunctionDeclaration') {
      return [{ name, node: binding.declaration }]
    }

    return declarationsIsFunctionValue(binding.initializer) ? [{ name, node: binding.initializer }] : []
  })
}

export function exportsCheckedFunctions(
  program: ESTree.Program,
  unexported: boolean,
  serviceMethods: boolean,
  allowed: RegExp[],
): DeclarationsTypes.DeclarationsFunction[] {
  const functions = [
    ...exportsFunctions(program),
    ...program.body.flatMap((statement) =>
      statement.type === 'ExportDefaultDeclaration' && declarationsIsFunctionValue(statement.declaration)
        ? [{ name: 'default', node: statement.declaration }]
        : [],
    ),
    ...(unexported ? declarationsTopLevelUnexportedFunctions(program) : []),
    ...(serviceMethods ? declarationsPublicServiceMethods(program) : []),
  ]

  return declarationsUnique(functions).filter(({ name }) => !optionsPatternsTest(allowed, name))
}
