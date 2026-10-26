import {
  typeEnvironmentIsBuiltIn,
  typeEnvironmentIsUnappliedReference,
  typeEnvironmentReference,
  typeEnvironmentResolveAlias,
  typeEnvironmentUnwrap,
} from './type-environment.ts'
import type * as DillonAntiSlopTypes from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

function isEffectivelyEmptyMember(member: ESTree.TSSignature): boolean {
  return (
    member.type === 'TSPropertySignature' &&
    member.optional &&
    member.typeAnnotation !== null &&
    typeEnvironmentUnwrap(member.typeAnnotation.typeAnnotation).type === 'TSNeverKeyword'
  )
}

export function dictionaryTypesUnsafeValue(
  type: ESTree.TSType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
  substitutions: DillonAntiSlopTypes.DillonAntiSlopSubstitutions,
  resolvingAliases: ReadonlySet<string>,
): DillonAntiSlopTypes.DillonAntiSlopUnsafeValue | null {
  const unwrapped = typeEnvironmentUnwrap(type)

  if (unwrapped.type === 'TSUnknownKeyword') {
    return 'unknown'
  }

  if (unwrapped.type === 'TSAnyKeyword') {
    return 'any'
  }

  if (unwrapped.type === 'TSObjectKeyword') {
    return 'object'
  }

  if (unwrapped.type === 'TSTypeLiteral' && unwrapped.members.every(isEffectivelyEmptyMember)) {
    return 'empty-object'
  }

  if (unwrapped.type === 'TSUnionType') {
    return unwrapped.types.some(
      (member) => dictionaryTypesUnsafeValue(member, environment, substitutions, resolvingAliases) !== null,
    )
      ? 'union'
      : null
  }

  if (unwrapped.type === 'TSIntersectionType') {
    const unsafeMembers = unwrapped.types.map((member) =>
      dictionaryTypesUnsafeValue(member, environment, substitutions, resolvingAliases),
    )

    if (unsafeMembers.includes('any')) {
      return 'any'
    }

    return unsafeMembers.length > 0 && unsafeMembers.every((member) => member !== null) ? unsafeMembers[0] : null
  }

  const named = typeEnvironmentReference(unwrapped, environment)

  if (named === null) {
    return null
  }

  const { reference, name } = named

  if (named.transparent) {
    return named.argument === undefined ? null : dictionaryTypesUnsafeValue(named.argument, environment, substitutions, resolvingAliases)
  }

  const substitution = substitutions.get(name)

  if (substitution !== undefined) {
    return typeEnvironmentIsUnappliedReference(substitution, name)
      ? null
      : dictionaryTypesUnsafeValue(substitution, environment, substitutions, resolvingAliases)
  }

  const interfaceDeclarations = environment.interfaces.get(name)

  if (interfaceDeclarations !== undefined) {
    const [declaration] = interfaceDeclarations
    return interfaceDeclarations.length === 1 &&
      declaration.extends.length === 0 &&
      declaration.body.body.every(isEffectivelyEmptyMember)
      ? 'empty-object'
      : null
  }

  const step = typeEnvironmentResolveAlias(name, reference, environment, substitutions, resolvingAliases)
  return step === null ? null : dictionaryTypesUnsafeValue(step.type, environment, step.substitutions, step.resolving)
}

export function dictionaryTypesValueTypes(
  type: ESTree.TSType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
  substitutions: DillonAntiSlopTypes.DillonAntiSlopSubstitutions,
  resolvingAliases: ReadonlySet<string>,
): readonly DillonAntiSlopTypes.DillonAntiSlopResolvedType[] {
  const unwrapped = typeEnvironmentUnwrap(type)

  if (unwrapped.type === 'TSTypeLiteral') {
    return unwrapped.members.flatMap((member): readonly DillonAntiSlopTypes.DillonAntiSlopResolvedType[] =>
      member.type === 'TSIndexSignature' ? [{ type: member.typeAnnotation.typeAnnotation, substitutions }] : [],
    )
  }

  if (unwrapped.type === 'TSMappedType') {
    return unwrapped.typeAnnotation === null ? [] : [{ type: unwrapped.typeAnnotation, substitutions }]
  }

  const named = typeEnvironmentReference(unwrapped, environment)

  if (named === null) {
    return []
  }

  const { reference, name } = named

  const substitution = substitutions.get(name)

  if (substitution !== undefined) {
    return typeEnvironmentIsUnappliedReference(substitution, name)
      ? []
      : dictionaryTypesValueTypes(substitution, environment, substitutions, resolvingAliases)
  }

  if (named.transparent) {
    return named.argument === undefined ? [] : dictionaryTypesValueTypes(named.argument, environment, substitutions, resolvingAliases)
  }

  if (name === 'Record' && typeEnvironmentIsBuiltIn(name, environment)) {
    const value = reference.typeArguments?.params[1] ?? null
    return value === null ? [] : [{ type: value, substitutions }]
  }

  if ((name === 'Pick' || name === 'Omit') && typeEnvironmentIsBuiltIn(name, environment)) {
    const source = reference.typeArguments?.params[0]
    return source === undefined ? [] : dictionaryTypesValueTypes(source, environment, substitutions, resolvingAliases)
  }

  const step = typeEnvironmentResolveAlias(name, reference, environment, substitutions, resolvingAliases)
  return step === null ? [] : dictionaryTypesValueTypes(step.type, environment, step.substitutions, step.resolving)
}

export function dictionaryTypesClassify(
  type: ESTree.TSType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
): DillonAntiSlopTypes.DillonAntiSlopUnsafeValue | null {
  for (const valueType of dictionaryTypesValueTypes(type, environment, new Map(), new Set())) {
    const unsafeValue = dictionaryTypesUnsafeValue(valueType.type, environment, valueType.substitutions, new Set())

    if (unsafeValue !== null) {
      return unsafeValue
    }
  }
  return null
}
