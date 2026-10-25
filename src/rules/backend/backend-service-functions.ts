import { defineRule } from '@oxlint/plugins'
import { declarationsPublicServiceMethods, declarationsTopLevelCandidates } from '../../utils/declarations.utils.ts'
import { exportsCollect, exportsFunctions } from '../../utils/exports.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { BackendServiceFunctionsOptions } from '../../types/backend.types.ts'
import type { ESTree } from '@oxlint/plugins'

function backendOwner(node: ESTree.Node): ESTree.Node | undefined {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression' || parent.type === 'ArrowFunctionExpression') {
      return parent
    }

    if (parent.type === 'Program') {
      return undefined
    }
  }
  return undefined
}

export const backendServiceFunctions = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          frontend: { type: 'boolean' },
          allowLocalHelpers: { type: 'boolean' },
          allowReturnedMethods: { type: 'boolean' },
          singleExport: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
    ],
    messages: {
      helper: '{{name}}: {{message}}',
      exports: '{{message}}',
    },
  },
  createOnce(context) {
    let operation: ESTree.Node | undefined
    let operations = new Set<ESTree.Node>()
    let allowLocalHelpers = false
    let allowReturnedMethods = false
    let message = ''

    function allowedNested(node: ESTree.Function | ESTree.VariableDeclarator): boolean {
      const returnedMethod =
        allowReturnedMethods &&
        operation !== undefined &&
        backendOwner(node) === operation &&
        context.sourceCode.getDeclaredVariables(node).some((variable) =>
          variable.references.some(({ identifier }) => {
            const property = identifier.parent

            if (property.type !== 'Property' || property.value !== identifier || property.parent.type !== 'ObjectExpression') {
              return false
            }

            const object = property.parent
            return object.parent.type === 'ReturnStatement' && object.parent.argument === object && backendOwner(object) === operation
          }),
        )

      if (returnedMethod) {
        return true
      }

      if (!allowLocalHelpers) {
        return false
      }

      for (let parent: ESTree.Node | null = node.parent; parent; parent = parent.parent) {
        if (operations.has(parent)) {
          return true
        }
      }

      return false
    }

    function reportHelper(node: ESTree.Node, name: string): void {
      context.report({
        node,
        messageId: 'helper',
        data: { message, name },
      })
    }

    return {
      Program(program) {
        const options = optionsFirst<BackendServiceFunctionsOptions>(context, {})
        const multiple = Boolean(options.frontend && !options.singleExport)
        const candidates = declarationsTopLevelCandidates(program)
        const exported = exportsFunctions(program)
        operation = exported.length === 1 ? exported[0].node : undefined
        const single = operation ? [operation] : []
        operations = new Set(
          multiple
            ? [...exported.map((entry) => entry.node), ...declarationsPublicServiceMethods(program).map((method) => method.node)]
            : single,
        )
        allowLocalHelpers = options.frontend === true || options.allowLocalHelpers === true
        allowReturnedMethods = options.allowReturnedMethods ?? false
        message = allowLocalHelpers
          ? 'Keep this helper inside the one exported operation; domain .utils.ts is only for genuinely shared logic.'
          : 'This service contract does not allow private helpers. Keep its existing factory/operation contract; domain .utils.ts is only for genuinely shared logic. Do not add a fake factory or public helper export.'

        if (options.frontend) {
          message =
            'Frontend service modules expose public domain operations. Keep operation-only helpers inside their public operation and genuinely shared helpers in domain .utils.ts; file-level private functions are forbidden.'
        }

        if (options.message !== undefined) {
          message = options.message
        }

        if (options.singleExport) {
          const bindings = exportsCollect(program)
          const [only] = bindings

          if (bindings.length !== 1 || !operation || only.default || only.reExport || only.typeOnly) {
            context.report({
              node: program,
              messageId: 'exports',
              data: {
                message: options.message ?? 'Export exactly one named operation. Do not export helpers, types, constants or re-exports.',
              },
            })
          }
        }

        const exportedAllowed = multiple || candidates.length === 1

        for (const candidate of candidates) {
          if (exportedAllowed && exported.some((entry) => entry.name === candidate.name)) {
            continue
          }
          reportHelper(candidate.node, candidate.name)
        }
      },
      FunctionDeclaration(node) {
        if (node.parent.type === 'Program' || node.parent.type === 'ExportNamedDeclaration' || allowedNested(node)) {
          return
        }
        reportHelper(node, node.id?.type === 'Identifier' ? node.id.name : '<anonymous>')
      },
      VariableDeclarator(node) {
        if (node.init?.type !== 'ArrowFunctionExpression' && node.init?.type !== 'FunctionExpression') {
          return
        }

        const statementParent = node.parent.parent?.type

        if (statementParent === 'Program' || statementParent === 'ExportNamedDeclaration' || allowedNested(node)) {
          return
        }
        reportHelper(node, node.id.type === 'Identifier' ? node.id.name : '<anonymous>')
      },
    }
  },
})
