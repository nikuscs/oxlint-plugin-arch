import { defineRule } from '@oxlint/plugins'
import type { ESTree, Variable } from '@oxlint/plugins'
import { astDottedName, astStaticMemberName, astVisit, optionsFirst } from '../utils/index.ts'

interface NoPromiseAllMutationOptions {
  combinators: string[]
  methods: string[]
  checkAssignments: boolean
}

type MutationBinding = Pick<ESTree.IdentifierReference, 'name' | 'range'>

function mutationBinding(node: ESTree.Node): MutationBinding | undefined {
  if (node.type === 'Identifier') {
    return node
  }

  if (node.type === 'MemberExpression') {
    return mutationBinding(node.object)
  }

  if (
    node.type === 'ChainExpression' ||
    node.type === 'ParenthesizedExpression' ||
    node.type === 'TSAsExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSTypeAssertion' ||
    node.type === 'TSNonNullExpression'
  ) {
    return mutationBinding(node.expression)
  }
}

function mutationBindings(node: ESTree.Node): MutationBinding[] {
  switch (node.type) {
    case 'ArrayPattern':
      return node.elements.flatMap((element) => (element ? mutationBindings(element) : []))
    case 'ObjectPattern':
      return node.properties.flatMap((property) =>
        property.type === 'RestElement' ? mutationBindings(property) : mutationBindings(property.value),
      )
    case 'AssignmentPattern':
      return mutationBindings(node.left)
    case 'RestElement':
      return mutationBindings(node.argument)
    default: {
      const binding = mutationBinding(node)
      return binding ? [binding] : []
    }
  }
}

/**
 * Rejects mutation of outer bindings from inside configured promise combinators.
 *
 * Example: `Promise.all(items.map(async item => results.push(await load(item))))` fails.
 */
export const noPromiseAllMutation = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          combinators: { type: 'array', items: { type: 'string' } },
          methods: { type: 'array', items: { type: 'string' } },
          checkAssignments: { type: 'boolean' },
        },
      },
    ],
    defaultOptions: [
      {
        combinators: ['Promise.all', 'Promise.allSettled', 'Promise.any', 'Promise.race'],
        methods: ['push', 'unshift', 'splice', 'set', 'add'],
        checkAssignments: true,
      },
    ],
    messages: {
      mutation: "Do not mutate outer binding '{{name}}' inside {{combinator}}().",
    },
  },
  createOnce(context) {
    const references = new Map<number, Variable | null>()
    const reported = new Set<number>()
    let combinators = new Set<string>()
    let methods = new Set<string>()
    let checkAssignments = true
    let referencesReady = false

    function ensureReferences() {
      if (referencesReady) {
        return
      }

      referencesReady = true
      for (const scope of context.sourceCode.scopeManager.scopes) {
        for (const reference of scope.references) {
          references.set(reference.identifier.range[0], reference.resolved)
        }
      }
    }

    function isOuterBinding(identifier: MutationBinding, call: ESTree.CallExpression): boolean {
      const variable = references.get(identifier.range[0])
      return (
        variable !== undefined &&
        variable !== null &&
        variable.identifiers.length > 0 &&
        variable.identifiers.every(
          (declaration) => declaration.range[0] < call.range[0] || declaration.range[1] > call.range[1],
        )
      )
    }

    function reportMutation(
      node: ESTree.Node,
      binding: MutationBinding | undefined,
      call: ESTree.CallExpression,
      combinator: string,
    ) {
      if (!binding || reported.has(binding.range[0]) || !isOuterBinding(binding, call)) {
        return
      }

      reported.add(binding.range[0])
      context.report({
        node,
        messageId: 'mutation',
        data: { name: binding.name, combinator },
      })
    }

    return {
      before() {
        const options = optionsFirst<NoPromiseAllMutationOptions>(context)
        combinators = new Set(options.combinators)
        methods = new Set(options.methods)
        checkAssignments = options.checkAssignments
        references.clear()
        reported.clear()
        referencesReady = false
      },
      CallExpression(node) {
        const combinator = astDottedName(node.callee)
        if (!combinator || !combinators.has(combinator)) {
          return
        }

        ensureReferences()

        for (const argument of node.arguments) {
          astVisit(argument, [node], (candidate) => {
            if (candidate.type === 'CallExpression' && candidate.callee.type === 'MemberExpression') {
              const method = astStaticMemberName(candidate.callee)
              if (method && methods.has(method)) {
                reportMutation(candidate, mutationBinding(candidate.callee.object), node, combinator)
              }
              return
            }

            if (checkAssignments && candidate.type === 'AssignmentExpression') {
              for (const binding of mutationBindings(candidate.left)) {
                reportMutation(candidate, binding, node, combinator)
              }
              return
            }

            if (checkAssignments && candidate.type === 'UpdateExpression') {
              reportMutation(candidate, mutationBinding(candidate.argument), node, combinator)
            }
          })
        }
      },
    }
  },
})
