import type { AstRuntimeFunction } from './ast.ts'
import type { ESTree } from '@oxlint/plugins'

export interface ExportsBinding {
  exportedName: string
  localName?: string
  node: ESTree.Node
  declaration?: ESTree.Declaration
  initializer?: ESTree.Expression | null
  typeOnly: boolean
  default: boolean
  reExport: boolean
}

export interface ExportsFunction {
  name: string
  node: AstRuntimeFunction
}

function moduleExportName(node: ESTree.ModuleExportName): string {
  return node.type === 'Identifier' ? node.name : node.value
}

function declarationBindings(declaration: ESTree.Declaration | null): ExportsBinding[] {
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

  const name = declaration.id?.name ?? '<anonymous>'
  return [{
    exportedName: name,
    localName: declaration.id?.name,
    node: declaration,
    declaration,
    typeOnly: declaration.type === 'TSInterfaceDeclaration'
      || declaration.type === 'TSTypeAliasDeclaration'
      || declaration.type === 'TSDeclareFunction',
    default: false,
    reExport: false,
  }]
}

function localBindings(program: ESTree.Program): Map<string, ExportsBinding> {
  const result = new Map<string, ExportsBinding>()

  for (const statement of program.body) {
    if (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration') {
      continue
    }

    if (statement.type.endsWith('Declaration')) {
      for (const binding of declarationBindings(statement as ESTree.Declaration)) {
        if (binding.localName) {
          result.set(binding.localName, binding)
        }
      }
    }
  }

  return result
}

export function exportsCollect(program: ESTree.Program): ExportsBinding[] {
  const locals = localBindings(program)

  return program.body.flatMap((statement) => {
    if (statement.type === 'ExportAllDeclaration') {
      return [{
        exportedName: '*',
        node: statement,
        typeOnly: statement.exportKind === 'type',
        default: false,
        reExport: true,
      }]
    }

    if (statement.type === 'ExportDefaultDeclaration') {
      if (statement.declaration.type === 'Identifier') {
        const local = locals.get(statement.declaration.name)
        return [{
          ...(local ?? {
            exportedName: 'default',
            node: statement,
            typeOnly: false,
            default: true,
            reExport: false,
          }),
          exportedName: 'default',
          localName: local?.localName ?? statement.declaration.name,
          default: true,
        }]
      }

      if (statement.declaration.type.endsWith('Declaration')) {
        const bindings = declarationBindings(statement.declaration as ESTree.Declaration)
        return bindings.length > 0
          ? bindings.map((binding) => ({ ...binding, exportedName: 'default', default: true }))
          : [{ exportedName: 'default', node: statement, typeOnly: false, default: true, reExport: false }]
      }

      return [{ exportedName: 'default', node: statement, typeOnly: false, default: true, reExport: false }]
    }

    if (statement.type !== 'ExportNamedDeclaration') {
      return []
    }

    return [
      ...declarationBindings(statement.declaration),
      ...statement.specifiers.map((specifier) => {
        const localName = moduleExportName(specifier.local)
        const local = locals.get(localName)
        return {
          ...(local ?? {
            exportedName: moduleExportName(specifier.exported),
            node: specifier,
            typeOnly: false,
            default: false,
            reExport: Boolean(statement.source),
          }),
          exportedName: moduleExportName(specifier.exported),
          localName,
          node: local?.node ?? specifier,
          typeOnly: specifier.exportKind === 'type' || statement.exportKind === 'type' || Boolean(local?.typeOnly),
          default: moduleExportName(specifier.exported) === 'default',
          reExport: Boolean(statement.source),
        }
      }),
    ]
  })
}

export function exportsCollectFunctions(program: ESTree.Program): ExportsFunction[] {
  return exportsCollect(program).flatMap((binding) => {
    const name = binding.localName ?? binding.exportedName

    if (binding.declaration?.type === 'FunctionDeclaration') {
      return [{ name, node: binding.declaration }]
    }

    return binding.initializer?.type === 'FunctionExpression' || binding.initializer?.type === 'ArrowFunctionExpression'
      ? [{ name, node: binding.initializer }]
      : []
  })
}
