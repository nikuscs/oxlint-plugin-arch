import type { DillonAntiSlopAliasResolution } from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

export function typeAliasesCollect(
  program: ESTree.Program,
  includeGeneric: boolean,
): Map<string, ESTree.TSTypeAliasDeclaration> {
  const aliases = new Map<string, ESTree.TSTypeAliasDeclaration>()

  for (const statement of program.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement

    if (declaration?.type === 'TSTypeAliasDeclaration' && (includeGeneric || !declaration.typeParameters)) {
      aliases.set(declaration.id.name, declaration)
    }
  }

  return aliases
}

export function typeAliasesResolvesTo(
  type: ESTree.TSType,
  resolution: DillonAntiSlopAliasResolution,
  visited: ReadonlySet<string> = new Set(),
): boolean {
  if (type.type === resolution.keyword) {
    return true
  }

  if (type.type === 'TSParenthesizedType') {
    return typeAliasesResolvesTo(type.typeAnnotation, resolution, visited)
  }

  if (resolution.unions && type.type === 'TSUnionType') {
    return type.types.some((member) => typeAliasesResolvesTo(member, resolution, visited))
  }

  if (type.type !== 'TSTypeReference' || type.typeName.type !== 'Identifier') {
    return false
  }

  const name = type.typeName.name

  if (resolution.promises && (name === 'Promise' || name === 'PromiseLike')) {
    const value = type.typeArguments?.params[0]
    return value !== undefined && typeAliasesResolvesTo(value, resolution, visited)
  }

  if ((type.typeArguments?.params.length ?? 0) > 0 || visited.has(name) || resolution.shadowed.has(name)) {
    return false
  }

  const alias = resolution.aliases.get(name)

  if (alias === undefined || alias.typeParameters) {
    return false
  }

  const nextVisited = new Set(visited)
  nextVisited.add(name)

  return typeAliasesResolvesTo(alias.typeAnnotation, resolution, nextVisited)
}
