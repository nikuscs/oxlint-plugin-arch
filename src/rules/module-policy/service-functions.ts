import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import type { ModuleServiceFunctionsOptions } from '../../types/module-policy.types.ts'
import {
  declarationsFileLevelFunctionCandidates,
  declarationsPublicServiceMethods,
  exportsCollectFunctions,
  exportsCollect,
  optionsFirst,
} from '../../utils/index.ts'

/** Keep backend operations strict; frontend modules may expose several operations with helpers nested inside them. */
export const serviceFunctions = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        frontend: { type: 'boolean' },
        allowLocalHelpers: { type: 'boolean' },
        allowReturnedMethods: { type: 'boolean' },
        singleExport: { type: 'boolean' },
        message: { type: 'string' },
      },
    }],
    messages: {
      helper:
        '{{message}}',
      exports: '{{message}}',
    },
  },
  createOnce(context) {
    let operation: ESTree.Node | undefined
    let operations = new Set<ESTree.Node>()
    let allowLocalHelpers = false
    let allowReturnedMethods = false
    let message = ''
    function owner(node: ESTree.Node): ESTree.Node | undefined {
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression' || parent.type === 'ArrowFunctionExpression') return parent
        if (parent.type === 'Program') return undefined
      }
      return undefined
    }
    function insideOperation(node: ESTree.Node): boolean {
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (operations.has(parent)) return true
      }
      return false
    }
    function returnedMethod(node: ESTree.Function | ESTree.VariableDeclarator): boolean {
      if (!allowReturnedMethods || !operation || owner(node) !== operation) return false
      return context.sourceCode.getDeclaredVariables(node).some((variable) => variable.references.some((reference) => {
        const property = reference.identifier.parent
        if (property.type !== 'Property' || property.value !== reference.identifier || property.parent.type !== 'ObjectExpression') return false
        const object = property.parent
        if (object.parent.type !== 'ReturnStatement' || object.parent.argument !== object) return false
        return owner(object) === operation
      }))
    }
    return {
      Program(program) {
        const options = optionsFirst<ModuleServiceFunctionsOptions>(context, {})
        const candidates = declarationsFileLevelFunctionCandidates(program)
        const exported = exportsCollectFunctions(program)
        operation = exported.length === 1 ? exported[0].node : undefined
        operations = new Set(options.frontend && !options.singleExport ? exported.map((entry) => entry.node) : operation ? [operation] : [])
        if (options.frontend && !options.singleExport) {
          for (const method of declarationsPublicServiceMethods(program)) operations.add(method.node)
        }
        allowLocalHelpers = options.frontend || (options.allowLocalHelpers ?? false)
        allowReturnedMethods = options.allowReturnedMethods ?? false
        message = options.message ?? (options.frontend
          ? 'Frontend service modules expose public domain operations. Keep operation-only helpers inside their public operation and genuinely shared helpers in domain .utils.ts; file-level private functions are forbidden.'
          : 'This service file owns one exported function. Private helpers are allowed only inside action/query operations. Use domain .utils.ts files only for genuinely shared helpers.')
        if (options.singleExport) {
          const bindings = exportsCollect(program)
          if (
            bindings.length !== 1 || !operation ||
            bindings[0].default || bindings[0].reExport || bindings[0].typeOnly
          ) {
            context.report({
              node: program,
              messageId: 'exports',
              data: { message: options.message ?? 'Export exactly one named operation, with no extra values, types or re-exports. Keep action/query-specific helpers private inside the operation; .utils.ts is only for genuinely shared helpers.' },
            })
          }
        }
        for (const candidate of candidates) {
          if (
            (options.frontend && !options.singleExport || candidates.length === 1) &&
            exported.some((entry) => entry.name === candidate.name)
          ) {
            continue
          }
          context.report({ node: candidate.node, messageId: 'helper', data: { message } })
        }
      },
      FunctionDeclaration(node) {
        if (
          node.parent.type === 'Program' ||
          node.parent.type === 'ExportNamedDeclaration'
        ) {
          return
        }
        if (returnedMethod(node) || allowLocalHelpers && insideOperation(node)) {
          return
        }
        context.report({ node, messageId: 'helper', data: { message } })
      },
      VariableDeclarator(node) {
        if (
          node.init?.type !== 'ArrowFunctionExpression' &&
          node.init?.type !== 'FunctionExpression'
        ) {
          return
        }
        if (
          node.parent.parent?.type === 'Program' ||
          node.parent.parent?.type === 'ExportNamedDeclaration'
        ) {
          return
        }
        if (returnedMethod(node)) return
        if (allowLocalHelpers && insideOperation(node)) {
          return
        }
        context.report({ node, messageId: 'helper', data: { message } })
      },
    }
  },
})
