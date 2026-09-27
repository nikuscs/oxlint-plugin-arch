import { defineRule } from '@oxlint/plugins'
import { astVisit, optionsFirst } from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface NoInlineTypesOptions {
  parameters?: boolean
  returns?: boolean
  functionTypes?: boolean
}

function parameterAnnotation(parameter: ESTree.ParamPattern): ESTree.TSTypeAnnotation | null | undefined {
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
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        parameters: { type: 'boolean' },
        returns: { type: 'boolean' },
        functionTypes: { type: 'boolean' },
      },
    }],
    messages: {
      inlineType: 'Use a named type instead of an inline {{kind}} type in this {{position}} annotation.',
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { parameters = true, returns = true, functionTypes = true } = optionsFirst<NoInlineTypesOptions>(context, {})
        const isInline = (node: ESTree.Node) => node.type === 'TSTypeLiteral'
          || functionTypes && (node.type === 'TSFunctionType' || node.type === 'TSConstructorType')

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

        astVisit(program, [], (node) => {
          if (node.type !== 'FunctionDeclaration' && node.type !== 'FunctionExpression'
            && node.type !== 'ArrowFunctionExpression' && node.type !== 'TSDeclareFunction'
            && node.type !== 'TSEmptyBodyFunctionExpression') {
            return
          }

          if (parameters) {
            for (const parameter of node.params) {
              check(parameterAnnotation(parameter), 'parameter')
            }
          }

          if (returns) {
            check(node.returnType, 'return')
          }
        })
      },
    }
  },
})
