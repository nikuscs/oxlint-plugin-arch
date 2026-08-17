import { astVisit } from './ast.ts'
import type { ESTree } from '@oxlint/plugins'

export function sanitizersCallsConfigured(node: unknown, names: Set<string>): boolean {
  let found = false
  astVisit(node, [], (candidate) => {
    if (candidate.type === 'CallExpression' && candidate.callee.type === 'Identifier' && names.has(candidate.callee.name)) {
      found = true
    }
  })

  return found
}

export function sanitizersConfiguredBindings(program: ESTree.Program, names: Set<string>): Set<string> {
  const result = new Set<string>()

  for (const statement of program.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement

    if (declaration?.type !== 'VariableDeclaration') {
      continue
    }

    for (const item of declaration.declarations) {
      if (item.id.type === 'Identifier' && sanitizersCallsConfigured(item.init, names)) {
        result.add(item.id.name)
      }
    }
  }

  return result
}
