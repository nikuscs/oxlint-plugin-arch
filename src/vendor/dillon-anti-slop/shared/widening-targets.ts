import { dictionaryTypesValueTypes } from './dictionary-types.ts'
import {
  typeEnvironmentIsBuiltIn,
  typeEnvironmentIsUnappliedReference,
  typeEnvironmentReference,
  typeEnvironmentResolveAlias,
  typeEnvironmentSubstitution,
  typeEnvironmentUnwrap,
} from './type-environment.ts'
import type * as DillonAntiSlopTypes from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

function keywordTarget(type: ESTree.TSType): DillonAntiSlopTypes.DillonAntiSlopWideningTarget | null {
  if (type.type === 'TSUnknownKeyword') {
    return { kind: 'unknown' }
  }

  return type.type === 'TSObjectKeyword' ? { kind: 'object' } : null
}

function isBroadMappedKey(
  type: ESTree.TSType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
  substitutions: DillonAntiSlopTypes.DillonAntiSlopSubstitutions,
): boolean {
  const unwrapped = typeEnvironmentUnwrap(type)

  if (
    unwrapped.type === 'TSStringKeyword' ||
    unwrapped.type === 'TSNumberKeyword' ||
    unwrapped.type === 'TSSymbolKeyword'
  ) {
    return true
  }

  if (unwrapped.type === 'TSUnionType') {
    return unwrapped.types.every((member) => isBroadMappedKey(member, environment, substitutions))
  }

  const named = typeEnvironmentReference(unwrapped, environment)

  if (named === null) {
    return false
  }

  const { name } = named

  const substitution = substitutions.get(name)

  if (substitution !== undefined && !typeEnvironmentIsUnappliedReference(substitution, name)) {
    return isBroadMappedKey(substitution, environment, substitutions)
  }

  return name === 'PropertyKey' && typeEnvironmentIsBuiltIn(name, environment)
}

function classifyAliasBroadTarget(
  type: ESTree.TSType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
  substitutions: DillonAntiSlopTypes.DillonAntiSlopSubstitutions,
  resolvingAliases: ReadonlySet<string>,
): DillonAntiSlopTypes.DillonAntiSlopWideningTarget | null {
  const unwrapped = typeEnvironmentUnwrap(type)
  const keyword = keywordTarget(unwrapped)

  if (keyword !== null) {
    return keyword
  }

  if (unwrapped.type === 'TSTypeLiteral') {
    return unwrapped.members.some((member) => member.type === 'TSIndexSignature') ? { kind: 'open dictionary' } : null
  }

  if (unwrapped.type === 'TSMappedType') {
    return isBroadMappedKey(unwrapped.constraint, environment, substitutions) ? { kind: 'open dictionary' } : null
  }

  const named = typeEnvironmentReference(unwrapped, environment)

  if (named === null) {
    return null
  }

  const { reference, name } = named

  const substitution = substitutions.get(name)

  if (substitution !== undefined) {
    return typeEnvironmentIsUnappliedReference(substitution, name)
      ? null
      : classifyAliasBroadTarget(substitution, environment, substitutions, resolvingAliases)
  }

  if (named.transparent) {
    return named.argument === undefined ? null : classifyAliasBroadTarget(named.argument, environment, substitutions, resolvingAliases)
  }

  if (name === 'Record' && typeEnvironmentIsBuiltIn(name, environment)) {
    return { kind: 'open dictionary' }
  }

  const step = typeEnvironmentResolveAlias(name, reference, environment, substitutions, resolvingAliases)
  return step === null ? null : classifyAliasBroadTarget(step.type, environment, step.substitutions, step.resolving)
}

export function wideningTargetsClassify(
  type: ESTree.TSType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
): DillonAntiSlopTypes.DillonAntiSlopWideningTarget | null {
  const unwrapped = typeEnvironmentUnwrap(type)
  const keyword = keywordTarget(unwrapped)

  if (keyword !== null) {
    return keyword
  }

  if (unwrapped.type === 'TSTypeLiteral') {
    if (unwrapped.members.some((member) => member.type === 'TSIndexSignature')) {
      return { kind: 'open dictionary' }
    }
    return unwrapped.members.length > 0 ? { kind: 'anonymous object' } : null
  }

  if (unwrapped.type === 'TSMappedType') {
    return { kind: 'open dictionary' }
  }

  const named = typeEnvironmentReference(unwrapped, environment)

  if (named === null) {
    return null
  }

  const { reference, name } = named

  if (named.transparent) {
    return named.argument === undefined ? null : wideningTargetsClassify(named.argument, environment)
  }

  if (name === 'Record' && typeEnvironmentIsBuiltIn(name, environment)) {
    return { kind: 'open dictionary' }
  }

  const alias = environment.aliases.get(name)

  if (alias === undefined) {
    return null
  }

  const substitutions = typeEnvironmentSubstitution(alias, reference, new Map())

  if ((alias.typeParameters?.params.length ?? 0) > 0) {
    return substitutions !== null &&
      dictionaryTypesValueTypes(alias.typeAnnotation, environment, substitutions, new Set([name])).length > 0
      ? { kind: 'generic container' }
      : null
  }

  return substitutions === null
    ? null
    : classifyAliasBroadTarget(alias.typeAnnotation, environment, substitutions, new Set([name]))
}
