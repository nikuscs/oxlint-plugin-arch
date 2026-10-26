import { defineRule } from '@oxlint/plugins'
import { astDottedName, astMemberName, astVisit } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { CodePromiseMutationBinding, CodePromiseMutationOptions } from '../../types/code.types.ts'
import type { ESTree, Variable } from '@oxlint/plugins'

function mutationBinding(node: ESTree.Node): CodePromiseMutationBinding | undefined {
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

  return undefined
}

function mutationBindings(node: ESTree.Node): CodePromiseMutationBinding[] {
  if (node.type === 'ArrayPattern') {
    return node.elements.flatMap((element) => (element ? mutationBindings(element) : []))
  }

  if (node.type === 'ObjectPattern') {
    return node.properties.flatMap((property) =>
      mutationBindings(property.type === 'RestElement' ? property : property.value),
    )
  }

  if (node.type === 'AssignmentPattern') {
    return mutationBindings(node.left)
  }

  if (node.type === 'RestElement') {
    return mutationBindings(node.argument)
  }

  const binding = mutationBinding(node)

  return binding ? [binding] : []
}

export const codePromiseMutation = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          combinators: { type: 'array', items: { type: 'string' } },
          methods: { type: 'array', items: { type: 'string' } },
          assignments: { type: 'boolean' },
        },
      },
    ],
    defaultOptions: [
      {
        combinators: ['Promise.all', 'Promise.allSettled', 'Promise.any', 'Promise.race'],
        methods: ['push', 'unshift', 'splice', 'set', 'add'],
        assignments: true,
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

    function report(
      node: ESTree.Node,
      binding: CodePromiseMutationBinding | undefined,
      call: ESTree.CallExpression,
      combinator: string,
    ) {
      const variable = binding ? references.get(binding.range[0]) : undefined

      const outer =
        variable !== undefined &&
        variable !== null &&
        variable.identifiers.length > 0 &&
        variable.identifiers.every((declaration) => declaration.range[0] < call.range[0] || declaration.range[1] > call.range[1])

      if (!binding || reported.has(binding.range[0]) || !outer) {
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
        const options = optionsFirst<CodePromiseMutationOptions>(context)
        combinators = new Set(options.combinators)
        methods = new Set(options.methods)
        checkAssignments = options.assignments
        references.clear()
        reported.clear()
      },
      CallExpression(node) {
        const combinator = astDottedName(node.callee)

        if (!combinator || !combinators.has(combinator)) {
          return
        }

        if (references.size === 0) {
          for (const scope of context.sourceCode.scopeManager.scopes) {
            for (const reference of scope.references) {
              references.set(reference.identifier.range[0], reference.resolved)
            }
          }
        }

        astVisit(node.arguments, [node], (candidate) => {
          if (candidate.type === 'CallExpression' && candidate.callee.type === 'MemberExpression') {
            const method = astMemberName(candidate.callee)

            if (method && methods.has(method)) {
              report(candidate, mutationBinding(candidate.callee.object), node, combinator)
            }

            return
          }

          if (!checkAssignments) {
            return
          }

          if (candidate.type === 'AssignmentExpression') {
            for (const binding of mutationBindings(candidate.left)) {
              report(candidate, binding, node, combinator)
            }
          } else if (candidate.type === 'UpdateExpression') {
            report(candidate, mutationBinding(candidate.argument), node, combinator)
          }
        })
      },
    }
  },
})
