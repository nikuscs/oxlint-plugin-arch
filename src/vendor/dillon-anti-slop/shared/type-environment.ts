import { typeReferenceName } from './type-reference-name.ts'
import type * as DillonAntiSlopTypes from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

const BUILT_INS = new Set(['Record', 'Readonly', 'Partial', 'Required', 'Pick', 'Omit', 'PropertyKey', 'NonNullable'])

const TRANSPARENT_WRAPPERS = new Set(['Readonly', 'Partial', 'Required', 'NonNullable'])

export function typeEnvironmentCreate(program: ESTree.Program): DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment {
  const aliases = new Map<string, ESTree.TSTypeAliasDeclaration>()
  const interfaces = new Map<string, ESTree.TSInterfaceDeclaration[]>()
  const shadowedBuiltIns = new Set<string>()

  for (const statement of program.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
        ? (statement.declaration ?? null)
        : statement

    if (declaration?.type === 'ImportDeclaration') {
      for (const specifier of declaration.specifiers) {
        if (BUILT_INS.has(specifier.local.name)) {
          shadowedBuiltIns.add(specifier.local.name)
        }
      }
      continue
    }

    if (declaration?.type === 'TSTypeAliasDeclaration') {
      const existing = aliases.get(declaration.id.name)

      if (existing === undefined) {
        aliases.set(declaration.id.name, declaration)
      } else {
        shadowedBuiltIns.add(declaration.id.name)
      }

      if (BUILT_INS.has(declaration.id.name)) {
        shadowedBuiltIns.add(declaration.id.name)
      }
      continue
    }

    if (declaration?.type === 'TSInterfaceDeclaration') {
      const declarations = interfaces.get(declaration.id.name) ?? []
      declarations.push(declaration)
      interfaces.set(declaration.id.name, declarations)
      if (BUILT_INS.has(declaration.id.name)) {
        shadowedBuiltIns.add(declaration.id.name)
      }
      continue
    }

    if (declaration?.type === 'TSEnumDeclaration') {
      if (BUILT_INS.has(declaration.id.name)) {
        shadowedBuiltIns.add(declaration.id.name)
      }
      continue
    }

    if (
      (declaration?.type === 'ClassDeclaration' || declaration?.type === 'FunctionDeclaration') &&
      declaration.id !== null &&
      BUILT_INS.has(declaration.id.name)
    ) {
      shadowedBuiltIns.add(declaration.id.name)
    }
  }

  return { aliases, interfaces, shadowedBuiltIns }
}

export function typeEnvironmentIsBuiltIn(name: string, environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment): boolean {
  return BUILT_INS.has(name) && !environment.shadowedBuiltIns.has(name)
}

export function typeEnvironmentUnwrap(type: ESTree.TSType): ESTree.TSType {
  let current = type

  while (
    current.type === 'TSParenthesizedType' ||
    (current.type === 'TSTypeOperator' && current.operator === 'readonly')
  ) {
    current = current.typeAnnotation
  }

  return current
}

export function typeEnvironmentReference(
  type: ESTree.TSType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
): DillonAntiSlopTypes.DillonAntiSlopNamedReference | null {
  if (type.type !== 'TSTypeReference') {
    return null
  }

  const name = typeReferenceName(type)

  if (name === null) {
    return null
  }

  return {
    reference: type,
    name,
    transparent: TRANSPARENT_WRAPPERS.has(name) && typeEnvironmentIsBuiltIn(name, environment),
    argument: type.typeArguments?.params.at(0),
  }
}

export function typeEnvironmentIsUnappliedReference(type: ESTree.TSType, name: string): boolean {
  const unwrapped = typeEnvironmentUnwrap(type)
  return (
    unwrapped.type === 'TSTypeReference' &&
    typeReferenceName(unwrapped) === name &&
    (unwrapped.typeArguments?.params.length ?? 0) === 0
  )
}

function resolvedSubstitutionArgument(
  type: ESTree.TSType,
  base: DillonAntiSlopTypes.DillonAntiSlopSubstitutions,
  resolving: ReadonlySet<string> = new Set(),
): ESTree.TSType {
  const unwrapped = typeEnvironmentUnwrap(type)

  if (unwrapped.type !== 'TSTypeReference') {
    return type
  }

  const name = typeReferenceName(unwrapped)

  if (name === null || resolving.has(name)) {
    return type
  }

  const substitution = base.get(name)

  if (substitution === undefined) {
    return type
  }

  const nextResolving = new Set(resolving)
  nextResolving.add(name)

  return resolvedSubstitutionArgument(substitution, base, nextResolving)
}

export function typeEnvironmentSubstitution(
  alias: ESTree.TSTypeAliasDeclaration,
  type: ESTree.TSTypeReference,
  base: DillonAntiSlopTypes.DillonAntiSlopSubstitutions,
): DillonAntiSlopTypes.DillonAntiSlopSubstitutions | null {
  const parameters = alias.typeParameters?.params ?? []
  const arguments_ = type.typeArguments?.params ?? []
  const next = new Map(base)

  for (const [index, parameter] of parameters.entries()) {
    const argument = arguments_.at(index) ?? parameter.default

    if (!argument) {
      return null
    }
    next.set(parameter.name.name, resolvedSubstitutionArgument(argument, next))
  }

  return next
}

export function typeEnvironmentResolveAlias(
  name: string,
  reference: ESTree.TSTypeReference,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
  substitutions: DillonAntiSlopTypes.DillonAntiSlopSubstitutions,
  resolving: ReadonlySet<string>,
): DillonAntiSlopTypes.DillonAntiSlopAliasStep | null {
  const alias = environment.aliases.get(name)

  if (alias === undefined || resolving.has(name)) {
    return null
  }

  const nextSubstitutions = typeEnvironmentSubstitution(alias, reference, substitutions)

  if (nextSubstitutions === null) {
    return null
  }

  const nextResolving = new Set(resolving)
  nextResolving.add(name)

  return { type: alias.typeAnnotation, substitutions: nextSubstitutions, resolving: nextResolving }
}
