import { astCallName, astContainsJsx, astNearestFunction, astReturnExpressions, astVisit } from './ast.utils.ts'
import { exportsCollect } from './exports.utils.ts'
import type { AstFunction } from '../types/ast.types.ts'
import type { DeclarationsCandidate } from '../types/declarations.types.ts'
import type { ESTree } from '@oxlint/plugins'

export function reactExportCandidates(program: ESTree.Program): DeclarationsCandidate[] {
  return exportsCollect(program).map((binding) => ({
    ...binding,
    name: binding.localName ?? binding.exportedName,
  }))
}

function reactReturnsOutput(program: ESTree.Program, node: AstFunction): boolean {
  const expressions = astReturnExpressions(node)

  if (expressions.some((expression) => astContainsJsx(expression) || (expression.type === 'Literal' && expression.value === null))) {
    return true
  }

  const returned = new Set(expressions.flatMap((expression) => (expression.type === 'Identifier' ? [expression.name] : [])))

  const propsWithChildren = new Set(
    program.body.flatMap((statement) =>
      statement.type === 'ImportDeclaration' && statement.source.value === 'react'
        ? statement.specifiers.flatMap((specifier) =>
          specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'PropsWithChildren'
            ? [specifier.local.name]
            : [],
        )
        : [],
    ),
  )

  return node.params.some((param) => {
    const returnsProp =
      param.type === 'ObjectPattern' &&
      param.properties.some(
        (property) => property.type === 'Property' && property.value.type === 'Identifier' && returned.has(property.value.name),
      )

    if (!returnsProp) {
      return false
    }

    let found = false
    astVisit(param.typeAnnotation, [], (candidate) => {
      if (candidate.type === 'TSTypeReference' && candidate.typeName.type === 'Identifier' && propsWithChildren.has(candidate.typeName.name)) {
        found = true
      }
    })

    return found
  })
}

function reactIsComponentValue(program: ESTree.Program, initializer: ESTree.Expression | null | undefined): boolean {
  if (!initializer) {
    return false
  }

  if (initializer.type === 'ArrowFunctionExpression' || initializer.type === 'FunctionExpression') {
    return reactReturnsOutput(program, initializer)
  }

  if (initializer.type !== 'CallExpression') {
    return false
  }

  const name = astCallName(initializer)

  if (name === 'forwardRef' || name === 'memo') {
    return initializer.arguments.some(
      (argument) => argument.type !== 'SpreadElement' && reactIsComponentValue(program, argument),
    )
  }

  if (name === 'lazy') {
    return initializer.arguments.some(
      (argument) => argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression',
    )
  }

  if (!name?.startsWith('create')) {
    return false
  }

  return program.body.some((statement) => {
    if (statement.type !== 'FunctionDeclaration' || statement.id?.name !== name) {
      return false
    }

    const components = new Set<string>()
    astVisit(statement.body, [statement], (candidate, ancestors) => {
      if (
        candidate.type === 'FunctionDeclaration' &&
        candidate !== statement &&
        candidate.id?.name &&
        /^[A-Z]/.test(candidate.id.name) &&
        astNearestFunction(ancestors) === statement &&
        reactReturnsOutput(program, candidate)
      ) {
        components.add(candidate.id.name)
      }
    })

    return astReturnExpressions(statement).some((expression) => expression.type === 'Identifier' && components.has(expression.name))
  })
}

export function reactIsComponent(program: ESTree.Program, candidate: DeclarationsCandidate): boolean {
  if (!/^[A-Z]/.test(candidate.name)) {
    return false
  }

  const declaration = candidate.declaration ?? candidate.node

  if (declaration.type === 'FunctionDeclaration') {
    return reactReturnsOutput(program, declaration)
  }

  return declaration.type === 'VariableDeclaration' && reactIsComponentValue(program, candidate.initializer)
}
