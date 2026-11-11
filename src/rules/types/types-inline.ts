import { defineRule } from '@oxlint/plugins'
import { astVisit } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { AstFunction } from '../../types/ast.types.ts'
import type { TypesInlineOptions } from '../../types/types.types.ts'
import type { ESTree } from '@oxlint/plugins'

function parameterAnnotation(parameter: ESTree.ParamPattern | ESTree.BindingPattern): ESTree.TSTypeAnnotation | null | undefined {
  if (parameter.type === 'TSParameterProperty') {
    return parameterAnnotation(parameter.parameter)
  }

  if (parameter.type === 'AssignmentPattern') {
    return parameterAnnotation(parameter.left)
  }

  return parameter.typeAnnotation
}

export const typesInline = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          parameters: { type: 'boolean' },
          returns: { type: 'boolean' },
          functions: { type: 'boolean' },
          variables: { type: 'boolean' },
          assertions: { type: 'boolean' },
          arguments: { type: 'boolean' },
          min: { type: 'integer', minimum: 1 },
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
    let checkVariables = false
    let checkAssertions = false
    let checkArguments = false
    let minMembers = 1

    function isInline(node: ESTree.Node): boolean {
      if (node.type === 'TSTypeLiteral') {
        return minMembers === 1 || node.members.length >= minMembers
      }
      return checkFunctionTypes && (node.type === 'TSFunctionType' || node.type === 'TSConstructorType')
    }

    function check(annotation: ESTree.Node | null | undefined, position: string) {
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

    function checkFunction(node: AstFunction) {
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
        const options = optionsFirst<TypesInlineOptions>(context, {})
        checkParameters = options.parameters ?? true
        checkReturns = options.returns ?? true
        checkFunctionTypes = options.functions ?? true
        checkVariables = options.variables ?? false
        checkAssertions = options.assertions ?? false
        checkArguments = options.arguments ?? false
        minMembers = options.min ?? 1
        if (!checkParameters && !checkReturns && !checkVariables && !checkAssertions && !checkArguments) {
          return false
        }
      },
      VariableDeclarator(node) {
        if (checkVariables) {
          check(parameterAnnotation(node.id), 'variable')
        }
      },
      PropertyDefinition(node) {
        if (checkVariables) {
          check(node.typeAnnotation, 'variable')
        }
      },
      TSAsExpression(node) {
        if (checkAssertions) {
          check(node.typeAnnotation, 'assertion')
        }
      },
      TSSatisfiesExpression(node) {
        if (checkAssertions) {
          check(node.typeAnnotation, 'assertion')
        }
      },
      CallExpression(node) {
        if (checkArguments) {
          check(node.typeArguments, 'type argument')
        }
      },
      NewExpression(node) {
        if (checkArguments) {
          check(node.typeArguments, 'type argument')
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
