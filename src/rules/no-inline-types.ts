import { defineRule } from '@oxlint/plugins'
import { astVisit, optionsFirst } from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface NoInlineTypesOptions {
  parameters?: boolean
  returns?: boolean
  functionTypes?: boolean
  minMembers?: number
}

function parameterAnnotation(
  parameter: ESTree.ParamPattern | ESTree.BindingPattern,
): ESTree.TSTypeAnnotation | null | undefined {
  if (parameter.type === 'TSParameterProperty') {
    return parameterAnnotation(parameter.parameter)
  }

  if (parameter.type === 'AssignmentPattern') {
    return parameterAnnotation(parameter.left)
  }

  return parameter.typeAnnotation
}

/**
 * Requires named types instead of inline object or function types in function signatures.
 * Checks nested annotations too, but leaves named type/interface definitions and inferred types alone.
 *
 * Example: `function save(input: SaveInput): SaveResult` passes; `function save(input: { id: string })` fails.
 */
export const noInlineTypes = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          parameters: { type: 'boolean' },
          returns: { type: 'boolean' },
          functionTypes: { type: 'boolean' },
          minMembers: { type: 'integer', minimum: 1 },
        },
      },
    ],
    messages: {
      inlineType: 'Use a named type instead of an inline {{kind}} type in this {{position}} annotation.',
    },
  },
  createOnce(context) {
    let checkParameters = true
    let checkReturns = true
    let checkFunctionTypes = true
    let minMembers = 1

    function isInline(node: ESTree.Node): boolean {
      return (
        (node.type === 'TSTypeLiteral' && (minMembers === 1 || node.members.length >= minMembers)) ||
        (checkFunctionTypes && (node.type === 'TSFunctionType' || node.type === 'TSConstructorType'))
      )
    }

    function check(annotation: ESTree.TSTypeAnnotation | null | undefined, position: string) {
      astVisit(annotation, [], (node, ancestors) => {
        if (!isInline(node) || ancestors.some(isInline)) {
          return
        }

        context.report({
          node,
          messageId: 'inlineType',
          data: { kind: node.type === 'TSTypeLiteral' ? 'object' : 'function', position },
        })
      })
    }

    function checkFunction(node: ESTree.Function | ESTree.ArrowFunctionExpression) {
      if (checkParameters) {
        for (const parameter of node.params) {
          check(parameterAnnotation(parameter), 'parameter')
        }
      }

      if (checkReturns) {
        check(node.returnType, 'return')
      }
    }

    return {
      before() {
        const options = optionsFirst<NoInlineTypesOptions>(context, {})
        checkParameters = options.parameters ?? true
        checkReturns = options.returns ?? true
        checkFunctionTypes = options.functionTypes ?? true
        minMembers = options.minMembers ?? 1

        if (!checkParameters && !checkReturns) {
          return false
        }
      },
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
      TSDeclareFunction: checkFunction,
      TSEmptyBodyFunctionExpression: checkFunction,
    }
  },
})
