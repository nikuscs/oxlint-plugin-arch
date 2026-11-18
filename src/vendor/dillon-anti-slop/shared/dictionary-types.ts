import { typeBindingsBound, typeBindingsStep, typeBindingsVisible } from './type-bindings.ts'
import { typeReferenceName } from './type-reference-name.ts'
import type * as DillonAntiSlopTypes from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

const builtIns = new Set(['Record', 'Readonly', 'Partial', 'Required', 'Pick', 'Omit', 'PropertyKey', 'NonNullable'])

const transparentWrappers = new Set(['Readonly', 'Partial', 'Required', 'NonNullable'])

const sourceWrappers = new Set([...transparentWrappers, 'Pick', 'Omit'])

function isBuiltIn(name: string, use: ESTree.Node, environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment): boolean {
  return builtIns.has(name) && typeBindingsVisible(name, use, environment) === undefined
}

function unwrapTransparent(type: ESTree.TSType): ESTree.TSType {
  let current = type

  while (current.type === 'TSParenthesizedType' || (current.type === 'TSTypeOperator' && current.operator === 'readonly')) {
    current = current.typeAnnotation
  }

  return current
}

function isEffectivelyEmptyMember(member: ESTree.TSSignature): boolean {
  return (
    member.type === 'TSPropertySignature' &&
    member.optional &&
    member.typeAnnotation !== null &&
    unwrapTransparent(member.typeAnnotation.typeAnnotation).type === 'TSNeverKeyword'
  )
}

function boundReference(bound: DillonAntiSlopTypes.DillonAntiSlopBoundType): DillonAntiSlopTypes.DillonAntiSlopBoundReference | null {
  const type = unwrapTransparent(bound.type)
  const name = type.type === 'TSTypeReference' ? typeReferenceName(type) : null

  return type.type === 'TSTypeReference' && name !== null ? { bound: { ...bound, type }, reference: type, name } : null
}

function wrappedArgument(
  reference: DillonAntiSlopTypes.DillonAntiSlopBoundReference,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
  names: ReadonlySet<string>,
): DillonAntiSlopTypes.DillonAntiSlopBoundType | null | undefined {
  if (!names.has(reference.name) || !isBuiltIn(reference.name, reference.reference, environment)) {
    return undefined
  }

  const wrapped = reference.reference.typeArguments?.params.at(0)

  return wrapped === undefined ? null : { ...reference.bound, type: wrapped }
}

function unsafeDirectValue(
  bound: DillonAntiSlopTypes.DillonAntiSlopBoundType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
): DillonAntiSlopTypes.DillonAntiSlopUnsafeValue | null {
  const unwrapped = unwrapTransparent(bound.type)
  const child = (type: ESTree.TSType) => unsafeDirectValue({ ...bound, type }, environment)

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
    return unwrapped.types.some((member) => child(member) !== null) ? 'union' : null
  }

  if (unwrapped.type === 'TSIntersectionType') {
    const members = unwrapped.types.map(child)

    if (members.includes('any')) {
      return 'any'
    }

    return members.length > 0 && members.every((member) => member !== null) ? (members.at(0) ?? null) : null
  }

  const reference = boundReference(bound)

  if (reference === null) {
    return null
  }

  const wrapped = wrappedArgument(reference, environment, transparentWrappers)

  if (wrapped !== undefined) {
    return wrapped === null ? null : unsafeDirectValue(wrapped, environment)
  }

  const declaration = reference.bound.substitutions.has(reference.name) ? null : typeBindingsVisible(reference.name, reference.reference, environment)

  if (declaration?.type === 'TSInterfaceDeclaration') {
    return declaration.extends.length === 0 && declaration.body.body.every(isEffectivelyEmptyMember) ? 'empty-object' : null
  }

  const next = typeBindingsStep(reference.bound, environment)

  return next === null ? null : unsafeDirectValue(next, environment)
}

function dictionaryValueTypes(
  bound: DillonAntiSlopTypes.DillonAntiSlopBoundType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
): DillonAntiSlopTypes.DillonAntiSlopBoundType[] {
  const unwrapped = unwrapTransparent(bound.type)

  if (unwrapped.type === 'TSTypeLiteral') {
    return unwrapped.members.flatMap((member) => (member.type === 'TSIndexSignature' ? [{ ...bound, type: member.typeAnnotation.typeAnnotation }] : []))
  }

  if (unwrapped.type === 'TSMappedType') {
    return unwrapped.typeAnnotation === null ? [] : [{ ...bound, type: unwrapped.typeAnnotation }]
  }

  const reference = boundReference(bound)

  if (reference === null) {
    return []
  }

  const wrapped = wrappedArgument(reference, environment, sourceWrappers)

  if (wrapped !== undefined) {
    return wrapped === null ? [] : dictionaryValueTypes(wrapped, environment)
  }

  if (reference.name === 'Record' && isBuiltIn(reference.name, reference.reference, environment)) {
    const value = reference.reference.typeArguments?.params.at(1)

    return value === undefined ? [] : [{ ...bound, type: value }]
  }

  const next = typeBindingsStep(reference.bound, environment)

  return next === null ? [] : dictionaryValueTypes(next, environment)
}

function isBroadMappedKey(bound: DillonAntiSlopTypes.DillonAntiSlopBoundType, environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment): boolean {
  const unwrapped = unwrapTransparent(bound.type)

  if (unwrapped.type === 'TSStringKeyword' || unwrapped.type === 'TSNumberKeyword' || unwrapped.type === 'TSSymbolKeyword') {
    return true
  }

  if (unwrapped.type === 'TSUnionType') {
    return unwrapped.types.some((member) => isBroadMappedKey({ ...bound, type: member }, environment))
  }

  const reference = boundReference(bound)

  if (reference === null) {
    return false
  }

  if (reference.name === 'PropertyKey' && isBuiltIn(reference.name, reference.reference, environment)) {
    return true
  }

  const next = typeBindingsStep(reference.bound, environment)

  return next !== null && isBroadMappedKey(next, environment)
}

function broadTarget(
  bound: DillonAntiSlopTypes.DillonAntiSlopBoundType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
  top: boolean,
): DillonAntiSlopTypes.DillonAntiSlopWideningTarget | null {
  const unwrapped = unwrapTransparent(bound.type)

  if (unwrapped.type === 'TSUnknownKeyword') {
    return { kind: 'unknown' }
  }

  if (unwrapped.type === 'TSObjectKeyword') {
    return { kind: 'object' }
  }

  if (unwrapped.type === 'TSTypeLiteral') {
    if (unwrapped.members.some((member) => member.type === 'TSIndexSignature')) {
      return { kind: 'open dictionary' }
    }

    return top && unwrapped.members.length > 0 ? { kind: 'anonymous object' } : null
  }

  if (unwrapped.type === 'TSMappedType') {
    return top || isBroadMappedKey({ ...bound, type: unwrapped.constraint }, environment) ? { kind: 'open dictionary' } : null
  }

  const reference = boundReference(bound)

  if (reference === null) {
    return null
  }

  const wrapped = wrappedArgument(reference, environment, transparentWrappers)

  if (wrapped !== undefined) {
    return wrapped === null ? null : broadTarget(wrapped, environment, top)
  }

  if (reference.name === 'Record' && isBuiltIn(reference.name, reference.reference, environment)) {
    const key = reference.reference.typeArguments?.params.at(0)

    return key === undefined || isBroadMappedKey({ ...bound, type: key }, environment) ? { kind: 'open dictionary' } : null
  }

  const next = typeBindingsStep(reference.bound, environment)
  const resolved = next === null ? null : broadTarget(next, environment, false)

  if (!top || next === null || next.substitutions.size === 0) {
    return resolved
  }

  return resolved?.kind === 'open dictionary' ? { kind: 'generic container' } : null
}

export function dictionaryTypesUnsafeValue(
  type: ESTree.TSType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
): DillonAntiSlopTypes.DillonAntiSlopUnsafeValue | null {
  return unsafeDirectValue(typeBindingsBound(type), environment)
}

export function dictionaryTypesUnsafeDictionary(
  type: ESTree.TSType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
): DillonAntiSlopTypes.DillonAntiSlopUnsafeValue | null {
  for (const value of dictionaryValueTypes(typeBindingsBound(type), environment)) {
    const unsafe = unsafeDirectValue(value, environment)

    if (unsafe !== null) {
      return unsafe
    }
  }

  return null
}

export function dictionaryTypesWideningTarget(
  type: ESTree.TSType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
): DillonAntiSlopTypes.DillonAntiSlopWideningTarget | null {
  return broadTarget(typeBindingsBound(type), environment, true)
}
