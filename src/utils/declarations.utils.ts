import { astNearestFunction, astUnwrap, astVisit } from './ast.utils.ts'
import type { AstFunction } from '../types/ast.types.ts'
import type * as DeclarationsTypes from '../types/declarations.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const declarationsKinds: readonly DeclarationsTypes.DeclarationsKind[] = [
  'function',
  'const',
  'let',
  'var',
  'class',
  'type',
  'interface',
  'enum',
]

function declarationsIsFunctionValue(node: ESTree.Expression | null | undefined): node is AstFunction {
  return node?.type === 'FunctionExpression' || node?.type === 'ArrowFunctionExpression'
}

function declarationsIdName(node: ESTree.Node): string | undefined {
  return 'id' in node && node.id && 'name' in node.id ? node.id.name : undefined
}

const declarationsKindByType = new Map<ESTree.Node['type'], DeclarationsTypes.DeclarationsKind>([
  ['FunctionDeclaration', 'function'],
  ['ClassDeclaration', 'class'],
  ['TSTypeAliasDeclaration', 'type'],
  ['TSInterfaceDeclaration', 'interface'],
  ['TSEnumDeclaration', 'enum'],
])

function declarationsKindOf(
  node: ESTree.Node,
  ancestors: ESTree.Node[],
): DeclarationsTypes.DeclarationsKind | undefined {
  if (node.type !== 'VariableDeclarator') {
    return declarationsKindByType.get(node.type)
  }

  const declaration = ancestors.findLast((ancestor) => ancestor.type === 'VariableDeclaration')
  return declaration?.type === 'VariableDeclaration' &&
    declaration.kind !== 'using' &&
    declaration.kind !== 'await using'
    ? declaration.kind
    : undefined
}

export function declarationsNamed(
  root: ESTree.Node,
  kinds?: readonly DeclarationsTypes.DeclarationsKind[],
): DeclarationsTypes.DeclarationsNamed[] {
  const allowed = kinds?.length ? new Set(kinds) : null
  const result: DeclarationsTypes.DeclarationsNamed[] = []
  astVisit(root, [], (node, ancestors) => {
    const kind = declarationsKindOf(node, ancestors)

    const name =
      node.type === 'VariableDeclarator' && node.id.type === 'Identifier' ? node.id.name : declarationsIdName(node)

    if (!kind || !name || (allowed && !allowed.has(kind))) {
      return
    }

    if (node.type === 'VariableDeclarator' && ancestors.some((ancestor) => ancestor.type.startsWith('For'))) {
      return
    }
    result.push({
      name,
      node,
      kind,
    })
  })

  return result
}

export function declarationsNamedFromNode(
  node: ESTree.Node,
): Required<DeclarationsTypes.DeclarationsNamed> | undefined {
  if (node.type === 'VariableDeclarator') {
    const kind = declarationsKindOf(node, [node.parent])
    let insideLoop = false

    for (let current: ESTree.Node | null = node.parent; current && !insideLoop; current = current.parent) {
      insideLoop = current.type === 'ForStatement' || current.type === 'ForInStatement' || current.type === 'ForOfStatement'
    }

    return kind && node.id.type === 'Identifier' && !insideLoop
      ? { name: node.id.name, node, kind }
      : undefined
  }

  const kind = declarationsKindOf(node, [])
  const name = declarationsIdName(node)
  return kind && name ? { name, node, kind } : undefined
}

export function declarationsFunctions(root: ESTree.Node): DeclarationsTypes.DeclarationsFunction[] {
  return declarationsNamed(root).flatMap((item) => {
    if (item.node.type === 'FunctionDeclaration') {
      return [{ name: item.name, node: item.node }]
    }
    return item.node.type === 'VariableDeclarator' && declarationsIsFunctionValue(item.node.init)
      ? [{ name: item.name, node: item.node.init }]
      : []
  })
}

export function declarationsTopLevelUnexportedFunctions(
  program: ESTree.Program,
): DeclarationsTypes.DeclarationsFunction[] {
  return program.body.flatMap((statement) => {
    if (statement.type === 'FunctionDeclaration') {
      return [{ name: statement.id?.name ?? '<anonymous>', node: statement }]
    }

    if (statement.type !== 'VariableDeclaration') {
      return []
    }

    return statement.declarations.flatMap((item) =>
      declarationsIsFunctionValue(item.init)
        ? [{ name: item.id.type === 'Identifier' ? item.id.name : '<anonymous>', node: item.init }]
        : [],
    )
  })
}

export function declarationsTopLevelCandidates(program: ESTree.Program): DeclarationsTypes.DeclarationsCandidate[] {
  const result: DeclarationsTypes.DeclarationsCandidate[] = []

  for (const statement of program.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
        ? statement.declaration
        : statement

    if (declaration?.type === 'FunctionDeclaration') {
      result.push({ name: declaration.id?.name ?? '<anonymous>', node: declaration })
      continue
    }

    if (declaration?.type !== 'VariableDeclaration' || declaration.kind !== 'const') {
      continue
    }

    for (const item of declaration.declarations) {
      if (declarationsIsFunctionValue(item.init)) {
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

export function declarationsFactories(
  program: ESTree.Program,
  pattern: RegExp,
): DeclarationsTypes.DeclarationsFunction[] {
  return program.body.flatMap((statement) => {
    const declaration =
      statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
        ? statement.declaration
        : statement

    if (declaration?.type === 'FunctionDeclaration') {
      const name = declaration.id?.name ?? '<anonymous>'
      return pattern.test(name) ? [{ name, node: declaration }] : []
    }

    if (declaration?.type !== 'VariableDeclaration') {
      return []
    }

    return declaration.declarations.flatMap((item) =>
      item.id.type === 'Identifier' && pattern.test(item.id.name) && declarationsIsFunctionValue(item.init)
        ? [{ name: item.id.name, node: item.init }]
        : [],
    )
  })
}

export function declarationsReturnedObjects(
  factory: DeclarationsTypes.DeclarationsFunction,
): ESTree.ObjectExpression[] {
  if (factory.node.type === 'ArrowFunctionExpression' && factory.node.body.type === 'ObjectExpression') {
    return [factory.node.body]
  }

  const result: ESTree.ObjectExpression[] = []
  astVisit(factory.node.body, [factory.node], (node, ancestors) => {
    if (
      node.type === 'ReturnStatement' &&
      node.argument?.type === 'ObjectExpression' &&
      astNearestFunction(ancestors) === factory.node
    ) {
      result.push(node.argument)
    }
  })

  return result
}

export function declarationsPropertyName(property: ESTree.ObjectPropertyKind): string | undefined {
  if (property.type === 'SpreadElement' || property.computed) {
    return undefined
  }

  if (property.key.type === 'Identifier') {
    return property.key.name
  }

  return property.key.type === 'Literal' && typeof property.key.value === 'string' ? property.key.value : undefined
}

export function declarationsIsObjectParam(node: ESTree.ParamPattern): boolean {
  if (node.type === 'ObjectPattern') {
    return true
  }

  if (node.type === 'TSParameterProperty') {
    return declarationsIsObjectParam(node.parameter)
  }

  const annotation = node.typeAnnotation?.typeAnnotation
  return (
    !annotation ||
    annotation.type === 'TSTypeReference' ||
    annotation.type === 'TSTypeLiteral' ||
    annotation.type === 'TSIntersectionType'
  )
}

export function declarationsFunctionName(node: ESTree.Function | ESTree.VariableDeclarator): string {
  if (node.type === 'VariableDeclarator') {
    return node.id.type === 'Identifier' ? node.id.name : '<anonymous>'
  }
  return node.id?.name ?? '<anonymous>'
}

export function declarationsIsRuntime(node: ESTree.Node): node is DeclarationsTypes.DeclarationsRuntime {
  return (
    node.type === 'VariableDeclaration' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'ClassDeclaration' ||
    node.type === 'TSEnumDeclaration'
  )
}

export function declarationsRuntimeName(node: DeclarationsTypes.DeclarationsRuntime): string {
  if (node.type === 'VariableDeclaration') {
    return node.declarations.map((item) => (item.id.type === 'Identifier' ? item.id.name : '<anonymous>')).join(', ')
  }
  return node.id?.name ?? '<anonymous>'
}

export function declarationsRuntimeKind(
  node: DeclarationsTypes.DeclarationsRuntime,
): 'class' | 'enum' | 'function' | 'variable' {
  if (node.type === 'ClassDeclaration') {
    return 'class'
  }

  if (node.type === 'TSEnumDeclaration') {
    return 'enum'
  }

  return node.type === 'FunctionDeclaration' ? 'function' : 'variable'
}

function declarationsIsTrivialExpression(node: ESTree.Expression): boolean {
  const value = astUnwrap(node)

  if (
    value.type === 'Identifier' ||
    value.type === 'ThisExpression' ||
    value.type === 'MetaProperty' ||
    value.type.endsWith('Literal') ||
    value.type === 'MemberExpression' ||
    value.type === 'CallExpression' ||
    value.type === 'NewExpression' ||
    value.type === 'TaggedTemplateExpression'
  ) {
    return true
  }

  return (
    value.type === 'LogicalExpression' &&
    declarationsIsTrivialExpression(value.left) &&
    declarationsIsTrivialExpression(value.right)
  )
}

export function declarationsIsTrivialFunction(node: AstFunction): boolean {
  if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') {
    return declarationsIsTrivialExpression(node.body)
  }

  if (node.body?.type !== 'BlockStatement') {
    return false
  }

  const statements = node.body.body.filter(
    (statement) =>
      statement.type !== 'EmptyStatement' && !(statement.type === 'ExpressionStatement' && statement.directive),
  )

  if (statements.length === 0) {
    return true
  }

  if (statements.length > 1) {
    return false
  }

  const [statement] = statements

  if (statement.type === 'ReturnStatement') {
    return !statement.argument || declarationsIsTrivialExpression(statement.argument)
  }

  return statement.type === 'ExpressionStatement' && declarationsIsTrivialExpression(statement.expression)
}

export function declarationsPublicServiceMethods(
  program: ESTree.Program,
): { name: string; node: ESTree.Function; binding: ESTree.VariableDeclarator }[] {
  return program.body.flatMap((statement) => {
    if (
      statement.type !== 'ExportNamedDeclaration' ||
      statement.declaration?.type !== 'VariableDeclaration' ||
      statement.declaration.kind !== 'const'
    ) {
      return []
    }
    return statement.declaration.declarations.flatMap((binding) => {
      if (binding.id.type !== 'Identifier' || !binding.init) {
        return []
      }

      const value = astUnwrap(binding.init)

      if (value.type !== 'ObjectExpression' || value.properties.length === 0) {
        return []
      }

      const methods = value.properties.flatMap((property) =>
        property.type === 'Property' &&
        property.method &&
        property.kind === 'init' &&
        !property.computed &&
        property.key.type === 'Identifier' &&
        property.value.type === 'FunctionExpression'
          ? [{ name: property.key.name, node: property.value, binding }]
          : [],
      )

      return methods.length === value.properties.length ? methods : []
    })
  })
}

export function declarationsUnique<T extends { name: string; node: ESTree.Node }>(items: readonly T[]): T[] {
  const seen = new Set<string>()

  return items.filter(({ name, node }) => {
    const key = `${name}:${node.start}:${node.end}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}
