import type { ESTree } from '@oxlint/plugins'

export type AstRuntimeFunction = ESTree.Function | ESTree.ArrowFunctionExpression

export function astIsNode(value: unknown): value is ESTree.Node {
  return value !== null && typeof value === 'object' && typeof Reflect.get(value, 'type') === 'string'
}

export function astVisit(node: unknown, ancestors: ESTree.Node[], callback: (node: ESTree.Node, ancestors: ESTree.Node[]) => void): void {
  if (Array.isArray(node)) {
    for (const child of node) {
      astVisit(child, ancestors, callback)
    }
    return
  }

  if (!astIsNode(node)) {
    return
  }

  callback(node, ancestors)

  for (const [key, value] of Object.entries(node)) {
    if (!['parent', 'type', 'start', 'end', 'range', 'loc'].includes(key)) {
      astVisit(value, [...ancestors, node], callback)
    }
  }
}

export function astContainsJsx(node: unknown): boolean {
  let found = false
  astVisit(node, [], (candidate) => {
    if (candidate.type === 'JSXElement' || candidate.type === 'JSXFragment') {
      found = true
    }
  })

  return found
}

export function astNearestFunction(ancestors: readonly ESTree.Node[]): AstRuntimeFunction | undefined {
  return [...ancestors].reverse().find((node): node is AstRuntimeFunction => node.type === 'FunctionDeclaration'
    || node.type === 'FunctionExpression'
    || node.type === 'ArrowFunctionExpression')
}

export function astDirectReturnExpressions(node: AstRuntimeFunction): ESTree.Expression[] {
  if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') {
    return [node.body]
  }

  const expressions: ESTree.Expression[] = []
  astVisit(node.body, [node], (candidate, ancestors) => {
    if (candidate.type === 'ReturnStatement' && candidate.argument && astNearestFunction(ancestors) === node) {
      expressions.push(candidate.argument)
    }
  })

  return expressions
}

export function astStaticMemberName(node: ESTree.MemberExpression): string | undefined {
  return !node.computed && node.property.type === 'Identifier' ? node.property.name : undefined
}

export function astCallName(node: ESTree.CallExpression): string | undefined {
  if (node.callee.type === 'Identifier') {
    return node.callee.name
  }

  return node.callee.type === 'MemberExpression' ? astStaticMemberName(node.callee) : undefined
}
