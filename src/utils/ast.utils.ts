import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from './options.utils.ts'
import type { AstFunction } from '../types/ast.types.ts'
import type { ESTree } from '@oxlint/plugins'

const astSkippedKeys = new Set(['parent', 'type', 'start', 'end', 'range', 'loc', 'tokens', 'comments'])

function astIsNode(value: unknown): value is ESTree.Node {
  return value !== null && typeof value === 'object' && typeof Reflect.get(value, 'type') === 'string'
}

export function astVisit(
  node: unknown,
  ancestors: ESTree.Node[],
  callback: (node: ESTree.Node, ancestors: ESTree.Node[]) => void,
): void {
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
  ancestors.push(node)
  for (const key in node) {
    if (Object.hasOwn(node, key) && !astSkippedKeys.has(key)) {
      astVisit(Reflect.get(node, key), ancestors, callback)
    }
  }
  ancestors.pop()
}

export function astMatchesCallee(name: string | undefined, callees: readonly string[], modifiers: ReadonlySet<string>): boolean {
  return (
    name !== undefined &&
    callees.some(
      (callee) =>
        name === callee ||
        (name.startsWith(`${callee}.`) &&
          name
            .slice(callee.length + 1)
            .split('.')
            .every((part) => modifiers.has(part))),
    )
  )
}

export function astIsTypeOnlyImport(node: ESTree.ImportDeclaration): boolean {
  return (
    node.importKind === 'type' ||
    (node.specifiers.length > 0 && node.specifiers.every((specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type'))
  )
}

export function astStaticString(node: ESTree.Node): string | undefined {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? node.quasis[0]?.value.raw
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

export function astNearestFunction(ancestors: readonly ESTree.Node[]): AstFunction | undefined {
  return ancestors.findLast(
    (node): node is AstFunction =>
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression',
  )
}

export function astReturnExpressions(node: AstFunction): ESTree.Expression[] {
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

export function astSingleExpression(node: AstFunction): ESTree.Expression | null {
  if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') {
    return node.body
  }

  if (node.body?.type !== 'BlockStatement') {
    return null
  }

  const statements = node.body.body.filter(
    (statement) =>
      statement.type !== 'EmptyStatement' && !(statement.type === 'ExpressionStatement' && statement.directive),
  )

  if (statements.length !== 1) {
    return null
  }

  const [statement] = statements

  if (statement.type === 'ReturnStatement') {
    return statement.argument
  }

  return statement.type === 'ExpressionStatement' ? statement.expression : null
}

export function astUnwrap(expression: ESTree.Expression): ESTree.Expression {
  if (expression.type === 'AwaitExpression') {
    return astUnwrap(expression.argument)
  }

  if (
    expression.type === 'ParenthesizedExpression' ||
    expression.type === 'TSAsExpression' ||
    expression.type === 'TSSatisfiesExpression' ||
    expression.type === 'TSTypeAssertion' ||
    expression.type === 'TSNonNullExpression' ||
    expression.type === 'ChainExpression'
  ) {
    return astUnwrap(expression.expression)
  }

  return expression
}

function astCallRoot(expression: ESTree.Expression): string | undefined {
  if (expression.type === 'Identifier') {
    return expression.name
  }
  return expression.type === 'MemberExpression' && !expression.computed && !expression.optional
    ? astCallRoot(expression.object)
    : undefined
}

export function astIsForwarder(node: AstFunction, expression: ESTree.Expression): boolean {
  const value = astUnwrap(expression)

  if (value.type === 'Literal') {
    return !('regex' in value)
  }

  if (value.type === 'TemplateLiteral') {
    return value.expressions.length === 0
  }

  if (value.type === 'Identifier') {
    return true
  }

  if (value.type !== 'CallExpression' || value.optional) {
    return false
  }

  const root = astCallRoot(value.callee)

  if (!root || node.params.some((param) => param.type !== 'Identifier')) {
    return false
  }

  const receiver = value.callee.type === 'MemberExpression' ? root : undefined

  const forwarded = node.params.flatMap((param) =>
    param.type === 'Identifier' && param.name !== receiver ? [param.name] : [],
  )

  return (
    value.arguments.length === forwarded.length &&
    value.arguments.every((argument, index) => argument.type === 'Identifier' && argument.name === forwarded[index])
  )
}

export function astModuleName(node: ESTree.ModuleExportName): string {
  return node.type === 'Identifier' ? node.name : node.value
}

export function astBindings(pattern: ESTree.BindingPattern | ESTree.BindingRestElement): ESTree.BindingIdentifier[] {
  switch (pattern.type) {
    case 'Identifier':
      return [pattern]
    case 'AssignmentPattern':
      return astBindings(pattern.left)
    case 'RestElement':
      return astBindings(pattern.argument)
    case 'ObjectPattern':
      return pattern.properties.flatMap((property) => astBindings(property.type === 'RestElement' ? property : property.value))
    case 'ArrayPattern':
      return pattern.elements.flatMap((element) => (element ? astBindings(element) : []))
  }
}

export function astDeclaration(statement: ESTree.Program['body'][number]) {
  return statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration' ? statement.declaration : statement
}

export function astMemberName(node: ESTree.MemberExpression): string | undefined {
  return !node.computed && node.property.type === 'Identifier' ? node.property.name : undefined
}

export function astDottedName(node: ESTree.Node): string | undefined {
  if (node.type === 'Identifier') {
    return node.name
  }

  if (node.type !== 'MemberExpression') {
    return undefined
  }

  const object = astDottedName(node.object)
  const property = astMemberName(node)
  return object && property ? `${object}.${property}` : undefined
}

export function astCallName(node: ESTree.CallExpression): string | undefined {
  if (node.callee.type === 'Identifier') {
    return node.callee.name
  }
  return node.callee.type === 'MemberExpression' ? astMemberName(node.callee) : undefined
}

export function astImportAliases(program: ESTree.Program): Map<string, string> {
  const aliases = new Map<string, string>()

  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier') {
        continue
      }

      const imported = astModuleName(specifier.imported)

      if (imported !== specifier.local.name) {
        aliases.set(specifier.local.name, imported)
      }
    }
  }

  return aliases
}

export function astResolvedCallName(
  node: ESTree.CallExpression,
  aliases: ReadonlyMap<string, string>,
): string | undefined {
  const name = astCallName(node)
  return name ? (aliases.get(name) ?? name) : undefined
}

export function astSelectorRule(selector: string, message: string) {
  return defineRule({
    meta: {
      type: 'problem',
      schema: [{ type: 'object', properties: { message: { type: 'string' } }, additionalProperties: false }],
      messages: { forbidden: '{{message}}' },
    },
    createOnce(context) {
      return {
        [selector]: (node: ESTree.Node) => {
          const options = optionsFirst<{ message?: string }>(context, {})
          context.report({
            node,
            messageId: 'forbidden',
            data: { message: options.message ?? message },
          })
        },
      }
    },
  })
}
