import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { optionsFirst, optionsOptionalPatterns, optionsPatternSchema, optionsPatternsTest } from '../utils/index.ts'
import type { OptionsPattern } from '../utils/index.ts'

type ModuleMutableKind = 'let' | 'var'

interface NoModuleMutableStateOptions {
  kinds?: ModuleMutableKind[]
  allowNamePattern?: OptionsPattern
}

function moduleMutableStateBindings(
  pattern: ESTree.BindingPattern | ESTree.BindingRestElement,
): { name: string; node: ESTree.BindingIdentifier }[] {
  if (pattern.type === 'Identifier') {
    return [{ name: pattern.name, node: pattern }]
  }

  if (pattern.type === 'AssignmentPattern') {
    return moduleMutableStateBindings(pattern.left)
  }

  if (pattern.type === 'RestElement') {
    return moduleMutableStateBindings(pattern.argument)
  }

  if (pattern.type === 'ObjectPattern') {
    return pattern.properties.flatMap((property) =>
      property.type === 'RestElement'
        ? moduleMutableStateBindings(property)
        : moduleMutableStateBindings(property.value),
    )
  }

  if (pattern.type === 'ArrayPattern') {
    return pattern.elements.flatMap((element) => (element ? moduleMutableStateBindings(element) : []))
  }

  return []
}

function moduleMutableStateInsideFunction(node: ESTree.Node): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'TSDeclareFunction' ||
      current.type === 'TSEmptyBodyFunctionExpression' ||
      current.type === 'StaticBlock'
    ) {
      return true
    }
  }

  return false
}

function moduleMutableStateIsModuleLet(node: ESTree.VariableDeclaration): boolean {
  const parent = node.parent
  return parent?.type === 'Program' || (parent?.type === 'ExportNamedDeclaration' && parent.parent?.type === 'Program')
}

function moduleMutableStateInsideAmbient(node: ESTree.Node): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (
      current.type === 'TSModuleDeclaration' &&
      (current.declare || current.global || current.id.type === 'Literal')
    ) {
      return true
    }
  }

  return false
}

/**
 * Rejects module-scope `let` and `var` bindings so mutable state cannot leak across requests or tests.
 *
 * Example: `const limit = 1` passes; `let count = 0` fails unless the name matches `allowNamePattern`.
 */
export const noModuleMutableState = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          kinds: {
            type: 'array',
            items: { type: 'string', enum: ['let', 'var'] },
          },
          allowNamePattern: optionsPatternSchema,
        },
      },
    ],
    messages: {
      moduleState: 'module state is shared across requests/tests; keep it local.',
    },
  },
  createOnce(context) {
    let kindSet = new Set<ModuleMutableKind>(['let', 'var'])
    let allowed: RegExp[] = []

    return {
      before() {
        const { kinds = ['let', 'var'], allowNamePattern } = optionsFirst<NoModuleMutableStateOptions>(context, {})
        kindSet = new Set(kinds)
        allowed = optionsOptionalPatterns(allowNamePattern)
      },
      VariableDeclaration(node) {
        if (node.declare || !kindSet.has(node.kind as ModuleMutableKind)) {
          return
        }

        if (
          (node.kind === 'let' && !moduleMutableStateIsModuleLet(node)) ||
          (node.kind === 'var' && moduleMutableStateInsideFunction(node)) ||
          moduleMutableStateInsideAmbient(node)
        ) {
          return
        }

        for (const declarator of node.declarations) {
          for (const binding of moduleMutableStateBindings(declarator.id)) {
            if (!optionsPatternsTest(allowed, binding.name)) {
              context.report({
                node: binding.node,
                messageId: 'moduleState',
              })
            }
          }
        }
      },
    }
  },
})
