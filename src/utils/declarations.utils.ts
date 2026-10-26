import { astDeclaration, astUnwrap, astVisit } from './ast.utils.ts'
import type { AstFunction } from '../types/ast.types.ts'
import type * as DeclarationsTypes from '../types/declarations.types.ts'
import type { ESTree } from '@oxlint/plugins'

export function declarationsIsFunctionValue(node: ESTree.Node | null | undefined): node is AstFunction {
  return node?.type === 'FunctionExpression' || node?.type === 'ArrowFunctionExpression'
}

export function declarationsIdName(node: ESTree.Node): string | undefined {
  return 'id' in node && node.id && 'name' in node.id ? node.id.name : undefined
}

const declarationsKindByType = new Map<ESTree.Node['type'], DeclarationsTypes.DeclarationsKind>([
  ['FunctionDeclaration', 'function'],
  ['ClassDeclaration', 'class'],
  ['TSTypeAliasDeclaration', 'type'],
  ['TSInterfaceDeclaration', 'interface'],
  ['TSEnumDeclaration', 'enum'],
])

export function declarationsKindOf(
  node: ESTree.Node,
  ancestors: ESTree.Node[],
): DeclarationsTypes.DeclarationsKind | undefined {
  if (node.type !== 'VariableDeclarator') {
    return declarationsKindByType.get(node.type)
  }

  const declaration = ancestors.findLast((ancestor) => ancestor.type === 'VariableDeclaration')
  return declaration?.type === 'VariableDeclaration' &&
    declaration.kind !== 'using' &&
    declaration.kind !== 'await using'
    ? declaration.kind
    : undefined
}

export function declarationsNamed(root: ESTree.Node): DeclarationsTypes.DeclarationsNamed[] {
  const result: DeclarationsTypes.DeclarationsNamed[] = []
  astVisit(root, [], (node, ancestors) => {
    const kind = declarationsKindOf(node, ancestors)

    const name =
      node.type === 'VariableDeclarator' && node.id.type === 'Identifier' ? node.id.name : declarationsIdName(node)

    if (!kind || !name) {
      return
    }

    if (node.type === 'VariableDeclarator' && ancestors.some((ancestor) => ancestor.type.startsWith('For'))) {
      return
    }
    result.push({
      name,
      node,
      kind,
    })
  })

  return result
}

export function declarationsFunctions(root: ESTree.Node): DeclarationsTypes.DeclarationsFunction[] {
  return declarationsNamed(root).flatMap((item) => {
    if (item.node.type === 'FunctionDeclaration') {
      return [{ name: item.name, node: item.node }]
    }
    return item.node.type === 'VariableDeclarator' && declarationsIsFunctionValue(item.node.init)
      ? [{ name: item.name, node: item.node.init }]
      : []
  })
}

export function declarationsTopLevelUnexportedFunctions(
  program: ESTree.Program,
): DeclarationsTypes.DeclarationsFunction[] {
  return program.body.flatMap((statement) => {
    if (statement.type === 'FunctionDeclaration') {
      return [{ name: statement.id?.name ?? '<anonymous>', node: statement }]
    }

    if (statement.type !== 'VariableDeclaration') {
      return []
    }

    return statement.declarations.flatMap((item) =>
      declarationsIsFunctionValue(item.init)
        ? [{ name: item.id.type === 'Identifier' ? item.id.name : '<anonymous>', node: item.init }]
        : [],
    )
  })
}

export function declarationsTopLevelCandidates(program: ESTree.Program): DeclarationsTypes.DeclarationsCandidate[] {
  const result: DeclarationsTypes.DeclarationsCandidate[] = []

  for (const statement of program.body) {
    const declaration = astDeclaration(statement)

    if (declaration?.type === 'FunctionDeclaration') {
      result.push({ name: declaration.id?.name ?? '<anonymous>', node: declaration })
      continue
    }

    if (declaration?.type !== 'VariableDeclaration' || declaration.kind !== 'const') {
      continue
    }

    for (const item of declaration.declarations) {
      if (declarationsIsFunctionValue(item.init)) {
        result.push({
          name: item.id.type === 'Identifier' ? item.id.name : '<anonymous>',
          node: declaration,
          initializer: item.init,
        })
      }
    }
  }

  return result
}

export function declarationsPropertyName(property: ESTree.ObjectPropertyKind): string | undefined {
  if (property.type === 'SpreadElement' || property.computed) {
    return undefined
  }

  if (property.key.type === 'Identifier') {
    return property.key.name
  }

  return property.key.type === 'Literal' && typeof property.key.value === 'string' ? property.key.value : undefined
}

export function declarationsIsRuntime(node: ESTree.Node): node is DeclarationsTypes.DeclarationsRuntime {
  return (
    node.type === 'VariableDeclaration' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'ClassDeclaration' ||
    node.type === 'TSEnumDeclaration'
  )
}

export function declarationsPublicServiceMethods(
  program: ESTree.Program,
): { name: string; node: ESTree.Function; binding: ESTree.VariableDeclarator }[] {
  return program.body.flatMap((statement) => {
    if (
      statement.type !== 'ExportNamedDeclaration' ||
      statement.declaration?.type !== 'VariableDeclaration' ||
      statement.declaration.kind !== 'const'
    ) {
      return []
    }
    return statement.declaration.declarations.flatMap((binding) => {
      if (binding.id.type !== 'Identifier' || !binding.init) {
        return []
      }

      const value = astUnwrap(binding.init)

      if (value.type !== 'ObjectExpression' || value.properties.length === 0) {
        return []
      }

      const methods = value.properties.flatMap((property) =>
        property.type === 'Property' &&
        property.method &&
        property.kind === 'init' &&
        !property.computed &&
        property.key.type === 'Identifier' &&
        property.value.type === 'FunctionExpression'
          ? [{ name: property.key.name, node: property.value, binding }]
          : [],
      )

      return methods.length === value.properties.length ? methods : []
    })
  })
}

export function declarationsUnique<T extends { name: string; node: ESTree.Node }>(items: readonly T[]): T[] {
  const seen = new Set<string>()

  return items.filter(({ name, node }) => {
    const key = `${name}:${node.start}:${node.end}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}
