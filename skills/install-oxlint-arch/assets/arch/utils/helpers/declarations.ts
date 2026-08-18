import { astVisit } from './ast.ts'
import type { AstRuntimeFunction } from './ast.ts'
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

function declarationsUnwrapExpression(node: ESTree.Expression): ESTree.Expression {
  if (node.type === 'ParenthesizedExpression' || node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression'
    || node.type === 'TSTypeAssertion' || node.type === 'TSNonNullExpression') {
    return declarationsUnwrapExpression(node.expression)
  }

  if (node.type === 'ChainExpression') {
    return declarationsUnwrapExpression(node.expression)
  }

  return node.type === 'AwaitExpression' && node.argument ? declarationsUnwrapExpression(node.argument) : node
}

export function declarationsIsTrivialExpression(node: ESTree.Expression): boolean {
  const value = declarationsUnwrapExpression(node)

  if (value.type === 'Identifier' || value.type === 'ThisExpression' || value.type === 'MetaProperty' || value.type.endsWith('Literal')) {
    return true
  }

  if (value.type === 'TemplateLiteral') {
    return value.expressions.length === 0
  }

  if (value.type === 'MemberExpression' || value.type === 'CallExpression' || value.type === 'NewExpression'
    || value.type === 'TaggedTemplateExpression') {
    return true
  }

  return value.type === 'LogicalExpression'
    && declarationsIsTrivialExpression(value.left)
    && declarationsIsTrivialExpression(value.right)
}

export function declarationsIsTrivialFunction(node: AstRuntimeFunction): boolean {
  if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') {
    return declarationsIsTrivialExpression(node.body)
  }

  if (!node.body || node.body.type !== 'BlockStatement') {
    return false
  }

  const statements = node.body.body.filter((statement) => statement.type !== 'EmptyStatement'
    && !(statement.type === 'ExpressionStatement' && statement.directive))

  if (statements.length === 0) {
    return true
  }

  if (statements.length > 1) {
    return false
  }

  const statement = statements[0]
  if (statement.type === 'ReturnStatement') {
    return !statement.argument || declarationsIsTrivialExpression(statement.argument)
  }

  return statement.type === 'ExpressionStatement' && declarationsIsTrivialExpression(statement.expression)
}

export interface DeclarationsNamed {
  name: string
  node: ESTree.Node
}

export function declarationsCollectNamed(root: ESTree.Node): DeclarationsNamed[] {
  const result: DeclarationsNamed[] = []

  astVisit(root, [], (node, ancestors) => {
    if ((node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration' || node.type === 'TSTypeAliasDeclaration'
      || node.type === 'TSInterfaceDeclaration' || node.type === 'TSEnumDeclaration') && node.id?.name) {
      result.push({ name: node.id.name, node })
      return
    }

    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier'
      && !ancestors.some((ancestor) => ancestor.type === 'ForStatement' || ancestor.type === 'ForInStatement'
        || ancestor.type === 'ForOfStatement')) {
      result.push({ name: node.id.name, node })
    }
  })

  return result
}

export function declarationsCollectFunctions(root: ESTree.Node): { name: string, node: AstRuntimeFunction }[] {
  return declarationsCollectNamed(root).flatMap((item) => {
    if (item.node.type === 'FunctionDeclaration') {
      return [{ name: item.name, node: item.node }]
    }

    if (item.node.type === 'VariableDeclarator'
      && (item.node.init?.type === 'FunctionExpression' || item.node.init?.type === 'ArrowFunctionExpression')) {
      return [{ name: item.name, node: item.node.init }]
    }

    return []
  })
}

