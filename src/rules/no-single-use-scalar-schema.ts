import { defineRule } from '@oxlint/plugins'
import {
  astStaticMemberName,
  exportsCollect,
  optionsFirst,
  schemasElements,
  schemasIsAllowedElement,
  schemasIsCall,
} from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface NoSingleUseScalarSchemaOptions {
  namespaces: string[]
  methods: string[]
  structuralMethods: string[]
  allowZodScalars: boolean
}

function isScalarSchema(
  node: ESTree.Expression,
  namespaces: Set<string>,
  structuralMethods: Set<string>,
): node is ESTree.CallExpression {
  if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression') {
    return false
  }

  if (schemasIsCall(node, namespaces)) {
    const method = astStaticMemberName(node.callee)
    return Boolean(method && !structuralMethods.has(method))
  }

  const modifier = astStaticMemberName(node.callee)
  return Boolean(
    modifier
      && !structuralMethods.has(modifier)
      && node.callee.object.type === 'CallExpression'
      && isScalarSchema(node.callee.object, namespaces, structuralMethods),
  )
}

function isDirectObjectField(
  identifier: ESTree.IdentifierReference,
  ancestors: ESTree.Node[],
  namespaces: Set<string>,
  structuralMethods: Set<string>,
): boolean {
  const property = ancestors.at(-1)
  const object = ancestors.at(-2)
  const call = ancestors.at(-3)

  if (property?.type !== 'Property' || property.value !== identifier || object?.type !== 'ObjectExpression'
    || call?.type !== 'CallExpression' || !schemasIsCall(call, namespaces)) {
    return false
  }

  const method = call.callee.type === 'MemberExpression' ? astStaticMemberName(call.callee) : undefined
  return Boolean(method === 'object' && structuralMethods.has(method) && call.arguments.includes(object))
}

function isAllowedStructuralElement(
  identifier: ESTree.IdentifierReference,
  initializer: ESTree.CallExpression,
  ancestors: ESTree.Node[],
  options: NoSingleUseScalarSchemaOptions,
  namespaces: Set<string>,
  structuralMethods: Set<string>,
): boolean {
  if (!options.allowZodScalars || !schemasIsAllowedElement(initializer, true, namespaces, structuralMethods)) {
    return false
  }

  const parent = ancestors.at(-1)
  const call = parent?.type === 'ArrayExpression' ? ancestors.at(-2) : parent

  if (call?.type !== 'CallExpression' || !schemasIsCall(call, namespaces)) {
    return false
  }

  const method = call.callee.type === 'MemberExpression' ? astStaticMemberName(call.callee) : undefined
  return Boolean(method && options.methods.includes(method) && schemasElements(call).includes(identifier))
}

/**
 * Reports a local scalar Zod schema binding used exactly once where the scalar can be written inline.
 *
 * Example: `const userId = z.number(); z.object({ id: userId })` fails; exported, reused, or inferred bindings pass.
 */
export const noSingleUseScalarSchema = defineRule({
  meta: {
    type: 'suggestion',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        namespaces: { type: 'array', items: { type: 'string' } },
        methods: { type: 'array', items: { type: 'string' } },
        structuralMethods: { type: 'array', items: { type: 'string' } },
        allowZodScalars: { type: 'boolean' },
      },
    }],
    defaultOptions: [{
      namespaces: ['z'],
      methods: ['array', 'union', 'record', 'tuple'],
      structuralMethods: ['and', 'array', 'discriminatedUnion', 'intersection', 'lazy', 'object', 'or', 'pipe', 'record', 'transform', 'tuple', 'union'],
      allowZodScalars: true,
    }],
    messages: { inline: 'Inline single-use scalar schema {{name}} at its only structural use.' },
  },
  create(context) {
    const candidates: ESTree.VariableDeclarator[] = []

    return {
      VariableDeclaration(node) {
        if (node.kind !== 'const') {
          return
        }

        for (const declarator of node.declarations) {
          if (declarator.id.type === 'Identifier' && declarator.init) {
            candidates.push(declarator)
          }
        }
      },
      'Program:exit'(program) {
        const options = optionsFirst<NoSingleUseScalarSchemaOptions>(context)
        const namespaces = new Set(options.namespaces)
        const structuralMethods = new Set(options.structuralMethods)
        const exportedNames = new Set(exportsCollect(program).flatMap((binding) => binding.localName ? [binding.localName] : []))

        for (const declarator of candidates) {
          const name = declarator.id.type === 'Identifier' ? declarator.id.name : undefined
          const initializer = declarator.init

          if (!name || !initializer || exportedNames.has(name) || !isScalarSchema(initializer, namespaces, structuralMethods)) {
            continue
          }

          const variable = context.sourceCode.getDeclaredVariables(declarator).find((candidate) => candidate.name === name)
          const references = variable?.references.filter((reference) => reference.isRead()) ?? []

          if (references.length !== 1) {
            continue
          }

          const reference = references[0]
          const identifier = reference.identifier as ESTree.IdentifierReference
          const ancestors = context.sourceCode.getAncestors(identifier) as unknown as ESTree.Node[]
          const inlineable = isDirectObjectField(identifier, ancestors, namespaces, structuralMethods)
            || isAllowedStructuralElement(identifier, initializer, ancestors, options, namespaces, structuralMethods)

          if (inlineable) {
            // Deliberately report-only: moving construction can cross comments or observable statements.
            context.report({
              node: declarator.id,
              messageId: 'inline',
              data: { name },
            })
          }
        }
      },
    }
  },
})
