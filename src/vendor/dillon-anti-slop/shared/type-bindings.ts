import { typeReferenceName } from './type-reference-name.ts'
import type * as DillonAntiSlopTypes from '../../../types/dillon-anti-slop.types.ts'
import type * as PluginsTypes from '@oxlint/plugins'

function isNode(value: unknown): value is PluginsTypes.ESTree.Node {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
}

function hasInferTypeParameter(node: PluginsTypes.ESTree.Node, name: string, visitorKeys: PluginsTypes.SourceCode['visitorKeys']): boolean {
  if (node.type === 'TSInferType' && node.typeParameter.name.name === name) {
    return true
  }

  for (const key of visitorKeys[node.type] ?? []) {
    const value: unknown = Reflect.get(node, key)

    if (isNode(value) && hasInferTypeParameter(value, name, visitorKeys)) {
      return true
    }

    if (Array.isArray(value) && value.some((child) => isNode(child) && hasInferTypeParameter(child, name, visitorKeys))) {
      return true
    }
  }

  return false
}

const environmentsByProgram = new WeakMap<PluginsTypes.ESTree.Program, DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment>()

const bindingKinds = [
  'ClassDeclaration',
  'ClassExpression',
  'ImportDefaultSpecifier',
  'ImportNamespaceSpecifier',
  'ImportSpecifier',
  'TSEnumDeclaration',
  'TSInterfaceDeclaration',
  'TSTypeAliasDeclaration',
] as const

export function typeBindingsWith(
  context: PluginsTypes.Context,
  createVisitors: (defer: DillonAntiSlopTypes.DillonAntiSlopDefer) => PluginsTypes.VisitorWithHooks,
): PluginsTypes.VisitorWithHooks {
  const checks: DillonAntiSlopTypes.DillonAntiSlopTypeCheck[] = []
  const state: DillonAntiSlopTypes.DillonAntiSlopTypeBindingsState = { collect: false }

  const visitors = createVisitors((check) => {
    checks.push(check)
  })

  for (const kind of bindingKinds) {
    const key: string = kind
    const visit = visitors[key]

    visitors[kind] = (node: DillonAntiSlopTypes.DillonAntiSlopTypeBinding) => {
      visit?.(node)

      const name = 'local' in node ? node.local.name : node.id?.name

      if (name === undefined || !state.collect || state.environment === undefined) {
        return
      }

      let scopes = state.environment.bindingsByName.get(name)

      if (scopes === undefined) {
        scopes = new Map()
        state.environment.bindingsByName.set(name, scopes)
      }

      let scope: PluginsTypes.ESTree.Node = node

      for (let current = node.parent; node.type !== 'ClassExpression'; current = current.parent) {
        if (
          current.type === 'Program' ||
          current.type === 'BlockStatement' ||
          current.type === 'TSModuleBlock' ||
          current.type === 'StaticBlock' ||
          current.type === 'SwitchStatement'
        ) {
          scope = current
          break
        }
      }

      scopes.set(scope, scopes.has(scope) ? null : node)
    }
  }

  const start = visitors.Program

  visitors.Program = (program: PluginsTypes.ESTree.Program) => {
    checks.length = 0
    state.environment = environmentsByProgram.get(program)
    state.collect = state.environment === undefined

    if (state.environment === undefined) {
      state.environment = { bindingsByName: new Map(), visitorKeys: context.sourceCode.visitorKeys }
      environmentsByProgram.set(program, state.environment)
    }
    start?.(program)
  }
  visitors['Program:exit'] = () => {
    const { environment } = state

    if (environment !== undefined) {
      for (const check of checks) {
        check(environment)
      }
    }
    checks.length = 0
    state.environment = undefined
  }

  return visitors
}

export function typeBindingsVisible(
  name: string,
  use: PluginsTypes.ESTree.Node,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
): DillonAntiSlopTypes.DillonAntiSlopTypeBinding | null | undefined {
  const scopes = environment.bindingsByName.get(name)
  let child: PluginsTypes.ESTree.Node | null = null
  let node: PluginsTypes.ESTree.Node | null = use

  while (node !== null) {
    if (scopes?.has(node)) {
      return scopes.get(node)
    }

    if (
      ('typeParameters' in node && node.typeParameters?.params.some((parameter) => parameter.name.name === name)) ||
      (node.type === 'TSMappedType' && (child === node.nameType || child === node.typeAnnotation) && node.key.name === name) ||
      (node.type === 'TSConditionalType' && child === node.trueType && hasInferTypeParameter(node.extendsType, name, environment.visitorKeys))
    ) {
      return null
    }
    child = node
    node = node.parent
  }

  return undefined
}

export function typeBindingsAlias(
  name: string,
  use: PluginsTypes.ESTree.Node,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
): PluginsTypes.ESTree.TSTypeAliasDeclaration | null {
  if (!environment.bindingsByName.has(name)) {
    return null
  }

  const declaration = typeBindingsVisible(name, use, environment)

  return declaration?.type === 'TSTypeAliasDeclaration' ? declaration : null
}

export function typeBindingsBound(type: PluginsTypes.ESTree.TSType): DillonAntiSlopTypes.DillonAntiSlopBoundType {
  return {
    type,
    substitutions: new Map(),
    resolving: new Set(),
  }
}

export function typeBindingsStep(
  bound: DillonAntiSlopTypes.DillonAntiSlopBoundType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
): DillonAntiSlopTypes.DillonAntiSlopBoundType | null {
  const { type } = bound
  const name = type.type === 'TSTypeReference' ? typeReferenceName(type) : null

  if (type.type !== 'TSTypeReference' || name === null) {
    return null
  }

  const substitution = type.typeArguments?.params.length ? undefined : bound.substitutions.get(name)

  if (substitution !== undefined) {
    return substitution
  }

  const alias = typeBindingsAlias(name, type, environment)

  if (alias === null || bound.resolving.has(alias)) {
    return null
  }

  const resolving = new Set([...bound.resolving, alias])
  const arguments_ = type.typeArguments?.params ?? []
  const substitutions = new Map<string, DillonAntiSlopTypes.DillonAntiSlopBoundType>()

  for (const [index, parameter] of (alias.typeParameters?.params ?? []).entries()) {
    const explicit = arguments_.at(index)
    const fallback = parameter.default

    if (explicit !== undefined) {
      substitutions.set(parameter.name.name, { ...bound, type: explicit })
      continue
    }

    if (fallback === null) {
      return null
    }
    substitutions.set(parameter.name.name, {
      type: fallback,
      substitutions: new Map(substitutions),
      resolving,
    })
  }

  return { type: alias.typeAnnotation, substitutions, resolving }
}

export function typeBindingsMatches(
  type: PluginsTypes.ESTree.TSType,
  environment: DillonAntiSlopTypes.DillonAntiSlopTypeEnvironment,
  matcher: DillonAntiSlopTypes.DillonAntiSlopTypeMatcher,
): boolean {
  const evaluate = (bound: DillonAntiSlopTypes.DillonAntiSlopBoundType): boolean => {
    const next = typeBindingsStep(bound, environment)

    return next === null ? matcher(bound.type, (child) => evaluate({ ...bound, type: child })) : evaluate(next)
  }

  return evaluate(typeBindingsBound(type))
}
