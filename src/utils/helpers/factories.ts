import { astNearestFunction, astVisit } from './ast.ts'
import { namingPascalCase } from './naming.ts'
import type { ESTree } from '@oxlint/plugins'

export interface FactoriesFunction {
  name: string
  node: ESTree.Function | ESTree.ArrowFunctionExpression
}

export function factoriesExpandTemplate(template: string, groups: Record<string, string>): string {
  return template.replaceAll(/\{([^}]+)\}/g, (placeholder, key: string) => {
    const group = groups[key.toLowerCase()]

    if (!group) {
      return placeholder
    }

    return /^[A-Z]/.test(key) ? namingPascalCase(group) : group
  })
}

export function factoriesCollectTopLevel(program: ESTree.Program, pattern: RegExp): FactoriesFunction[] {
  return program.body.flatMap((statement) => {
    const declaration = statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration' ? statement.declaration : statement

    if (declaration?.type === 'FunctionDeclaration') {
      const name = declaration.id?.name ?? '<anonymous>'
      return pattern.test(name) ? [{ name, node: declaration }] : []
    }

    if (declaration?.type !== 'VariableDeclaration') {
      return []
    }

    return declaration.declarations.flatMap((item) => item.id.type === 'Identifier' && pattern.test(item.id.name)
      && (item.init?.type === 'FunctionExpression' || item.init?.type === 'ArrowFunctionExpression')
      ? [{ name: item.id.name, node: item.init }]
      : [])
  })
}

export function factoriesDirectlyReturnedObjects(factory: FactoriesFunction): ESTree.ObjectExpression[] {
  if (factory.node.type === 'ArrowFunctionExpression' && factory.node.body.type === 'ObjectExpression') {
    return [factory.node.body]
  }

  const result: ESTree.ObjectExpression[] = []
  astVisit(factory.node.body, [factory.node], (node, ancestors) => {
    if (node.type === 'ReturnStatement' && node.argument?.type === 'ObjectExpression' && astNearestFunction(ancestors) === factory.node) {
      result.push(node.argument)
    }
  })

  return result
}

export function factoriesObjectPropertyName(property: ESTree.ObjectPropertyKind): string | undefined {
  if (property.type === 'SpreadElement' || property.computed) {
    return
  }

  if (property.key.type === 'Identifier') {
    return property.key.name
  }

  return property.key.type === 'Literal' && typeof property.key.value === 'string' ? property.key.value : undefined
}
