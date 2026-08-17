import {
  astCallName,
  astContainsJsx,
  astDirectReturnExpressions,
  astNearestFunction,
  astVisit,
} from './ast.ts'
import { exportsCollect } from './exports.ts'
import type { AstRuntimeFunction } from './ast.ts'
import type { ESTree } from '@oxlint/plugins'

export interface ReactComponentsCandidate {
  name: string
  node: ESTree.Node
  declaration?: ESTree.Declaration
  initializer?: ESTree.Expression | null
  typeOnly?: boolean
}

export function reactComponentsExportCandidates(program: ESTree.Program): ReactComponentsCandidate[] {
  return exportsCollect(program).map((binding) => ({
    ...binding,
    name: binding.localName ?? binding.exportedName,
  }))
}

function importedPropsWithChildren(program: ESTree.Program): Set<string> {
  return new Set(program.body.flatMap((statement) => statement.type === 'ImportDeclaration'
    && statement.source.value === 'react'
    ? statement.specifiers.flatMap((specifier) => specifier.type === 'ImportSpecifier'
      && specifier.imported.type === 'Identifier'
      && specifier.imported.name === 'PropsWithChildren'
      ? [specifier.local.name]
      : [])
    : []))
}

function containsNamedTypeReference(node: unknown, names: Set<string>): boolean {
  let found = false
  astVisit(node, [], (candidate) => {
    if (candidate.type === 'TSTypeReference'
      && candidate.typeName.type === 'Identifier'
      && names.has(candidate.typeName.name)) {
      found = true
    }
  })

  return found
}

function returnsReactChildren(program: ESTree.Program, node: AstRuntimeFunction, expressions: ESTree.Expression[]): boolean {
  const returnedNames = new Set(expressions.flatMap((expression) => expression.type === 'Identifier' ? [expression.name] : []))
  const propsWithChildren = importedPropsWithChildren(program)

  return node.params.some((param) => {
    if (param.type !== 'ObjectPattern') {
      return false
    }

    const returnsChild = param.properties.some((property) => property.type === 'Property'
      && property.value.type === 'Identifier'
      && returnedNames.has(property.value.name))
    return returnsChild && containsNamedTypeReference(param.typeAnnotation, propsWithChildren)
  })
}

export function reactComponentsFunctionReturnsOutput(program: ESTree.Program, node: AstRuntimeFunction): boolean {
  const expressions = astDirectReturnExpressions(node)
  return expressions.some((expression) => astContainsJsx(expression) || (expression.type === 'Literal' && expression.value === null))
    || returnsReactChildren(program, node, expressions)
}

function functionReturnsLocalComponent(program: ESTree.Program, node: ESTree.Function): boolean {
  const componentNames = new Set<string>()
  astVisit(node.body, [node], (candidate, ancestors) => {
    if (candidate.type === 'FunctionDeclaration'
      && candidate !== node
      && candidate.id?.name
      && /^[A-Z]/.test(candidate.id.name)
      && astNearestFunction(ancestors) === node
      && reactComponentsFunctionReturnsOutput(program, candidate)) {
      componentNames.add(candidate.id.name)
    }
  })

  return astDirectReturnExpressions(node)
    .some((expression) => expression.type === 'Identifier' && componentNames.has(expression.name))
}

function componentFactoryNames(program: ESTree.Program): Set<string> {
  return new Set(program.body.flatMap((statement) => statement.type === 'FunctionDeclaration'
    && statement.id?.name
    && functionReturnsLocalComponent(program, statement)
    ? [statement.id.name]
    : []))
}

function isComponentInitializer(program: ESTree.Program, initializer: ESTree.Expression | null | undefined): boolean {
  if (!initializer) {
    return false
  }

  if (initializer.type === 'ArrowFunctionExpression' || initializer.type === 'FunctionExpression') {
    return reactComponentsFunctionReturnsOutput(program, initializer)
  }

  if (initializer.type !== 'CallExpression') {
    return false
  }

  const name = astCallName(initializer)

  if (name === 'forwardRef' || name === 'memo') {
    return initializer.arguments.some((argument) => argument.type !== 'SpreadElement' && isComponentInitializer(program, argument))
  }

  if (name === 'lazy') {
    return initializer.arguments.some((argument) => argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
  }

  return Boolean(name?.startsWith('create') && componentFactoryNames(program).has(name))
}

export function reactComponentsIsLike(program: ESTree.Program, candidate: ReactComponentsCandidate): boolean {
  if (!/^[A-Z]/.test(candidate.name)) {
    return false
  }

  const declaration = candidate.declaration ?? candidate.node

  if (declaration.type === 'FunctionDeclaration') {
    return reactComponentsFunctionReturnsOutput(program, declaration)
  }

  return declaration.type === 'VariableDeclaration'
    && isComponentInitializer(program, candidate.initializer)
}

export function reactComponentsPascalFromBasename(basename: string): string {
  return basename
    .replace(/\.(tsx?|jsx?)$/, '')
    .split(/[-.]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
}
