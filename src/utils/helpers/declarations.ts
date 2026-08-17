import type { ReactComponentsCandidate } from './react-components.ts'
import type { ESTree } from '@oxlint/plugins'

export type DeclarationsRuntime = ESTree.VariableDeclaration | ESTree.Function | ESTree.Class | ESTree.TSEnumDeclaration

export function declarationsTopLevelUnexportedFunctions(program: ESTree.Program): { name: string, node: ESTree.Function | ESTree.ArrowFunctionExpression }[] {
  return program.body.flatMap((statement) => {
    if (statement.type === 'FunctionDeclaration') {
      return [{ name: statement.id?.name ?? '<anonymous>', node: statement }]
    }

    if (statement.type !== 'VariableDeclaration') {
      return []
    }

    return statement.declarations.flatMap((item) => item.init?.type === 'FunctionExpression' || item.init?.type === 'ArrowFunctionExpression'
      ? [{ name: item.id.type === 'Identifier' ? item.id.name : '<anonymous>', node: item.init }]
      : [])
  })
}

export function declarationsFileLevelFunctionCandidates(program: ESTree.Program): ReactComponentsCandidate[] {
  const result: ReactComponentsCandidate[] = []

  for (const statement of program.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration' ? statement.declaration : statement

    if (declaration?.type === 'FunctionDeclaration') {
      result.push({ name: declaration.id?.name ?? '<anonymous>', node: declaration })
      continue
    }

    if (declaration?.type !== 'VariableDeclaration' || declaration.kind !== 'const') {
      continue
    }

    for (const item of declaration.declarations) {
      if (item.init?.type === 'FunctionExpression' || item.init?.type === 'ArrowFunctionExpression') {
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

export function declarationsIsObjectParam(node: ESTree.ParamPattern): boolean {
  if (node.type === 'ObjectPattern') {
    return true
  }

  if (node.type === 'TSParameterProperty') {
    return declarationsIsObjectParam(node.parameter)
  }

  const annotation = node.typeAnnotation?.typeAnnotation
  return !annotation || annotation.type === 'TSTypeReference' || annotation.type === 'TSTypeLiteral' || annotation.type === 'TSIntersectionType'
}

export function declarationsFunctionName(node: ESTree.Function | ESTree.VariableDeclarator): string {
  if (node.type === 'VariableDeclarator') {
    return node.id.type === 'Identifier' ? node.id.name : '<anonymous>'
  }

  return node.id?.name ?? '<anonymous>'
}

export function declarationsIsRuntime(node: ESTree.Node): node is DeclarationsRuntime {
  return node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration' || node.type === 'TSEnumDeclaration'
}

export function declarationsRuntimeName(node: DeclarationsRuntime): string {
  if (node.type === 'VariableDeclaration') {
    return node.declarations.map((item) => item.id.type === 'Identifier' ? item.id.name : '<anonymous>').join(', ')
  }

  return node.id?.name ?? '<anonymous>'
}

export function declarationsRuntimeKind(node: DeclarationsRuntime): 'class' | 'enum' | 'function' | 'variable' {
  if (node.type === 'ClassDeclaration') {
    return 'class'
  }

  if (node.type === 'TSEnumDeclaration') {
    return 'enum'
  }

  if (node.type === 'FunctionDeclaration') {
    return 'function'
  }

  return 'variable'
}
