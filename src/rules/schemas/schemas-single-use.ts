import { defineRule } from '@oxlint/plugins'
import { astMemberName } from '../../utils/ast.utils.ts'
import { exportsCollect } from '../../utils/exports.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import {
  schemasElementDefaults,
  schemasElementOptionsSchema,
  schemasElements,
  schemasIsAllowedElement,
  schemasIsCall,
} from '../../utils/schemas.utils.ts'
import type { SchemasSingleUseOptions } from '../../types/schemas.types.ts'
import type { ESTree } from '@oxlint/plugins'

function calledMethod(node: ESTree.Node): string | undefined {
  return node.type === 'CallExpression' && node.callee.type === 'MemberExpression' ? astMemberName(node.callee) : undefined
}

function isScalarSchema(node: ESTree.Expression, namespaces: ReadonlySet<string>, structuralMethods: ReadonlySet<string>): node is ESTree.CallExpression {
  if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression') {
    return false
  }

  const method = astMemberName(node.callee)

  if (!method || structuralMethods.has(method)) {
    return false
  }

  if (schemasIsCall(node, namespaces)) {
    return true
  }

  return node.callee.object.type === 'CallExpression' && isScalarSchema(node.callee.object, namespaces, structuralMethods)
}

export const schemasSingleUse = defineRule({
  meta: {
    type: 'suggestion',
    schema: [schemasElementOptionsSchema],
    defaultOptions: [
      {
        ...schemasElementDefaults,
        structuralMethods: [
          'and',
          'array',
          'discriminatedUnion',
          'intersection',
          'lazy',
          'object',
          'or',
          'pipe',
          'record',
          'transform',
          'tuple',
          'union',
        ],
      },
    ],
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
        const options = optionsFirst<SchemasSingleUseOptions>(context)
        const namespaces = new Set(options.namespaces)
        const structuralMethods = new Set(options.structuralMethods)
        const exported = new Set(exportsCollect(program).flatMap((binding) => (binding.localName ? [binding.localName] : [])))

        for (const declarator of candidates) {
          const name = declarator.id.type === 'Identifier' ? declarator.id.name : undefined
          const initializer = declarator.init

          if (!name || !initializer || exported.has(name) || !isScalarSchema(initializer, namespaces, structuralMethods)) {
            continue
          }

          const variable = context.sourceCode.getDeclaredVariables(declarator).find((candidate) => candidate.name === name)
          const references = variable?.references.filter((reference) => reference.isRead()) ?? []

          if (references.length !== 1) {
            continue
          }

          const { identifier } = references[0]
          const parent = identifier.parent
          const object = parent.parent
          const objectCall = object?.parent
          const elementCall = parent.type === 'ArrayExpression' ? parent.parent : parent
          const elementMethod = calledMethod(elementCall)

          const isObjectField =
            parent.type === 'Property' &&
            parent.value === identifier &&
            object?.type === 'ObjectExpression' &&
            objectCall?.type === 'CallExpression' &&
            schemasIsCall(objectCall, namespaces) &&
            calledMethod(objectCall) === 'object' &&
            structuralMethods.has('object') &&
            objectCall.arguments.includes(object)

          const isStructuralElement =
            options.allowZodScalars &&
            schemasIsAllowedElement(initializer, true, namespaces, structuralMethods) &&
            elementCall.type === 'CallExpression' &&
            schemasIsCall(elementCall, namespaces) &&
            elementMethod !== undefined &&
            options.methods.includes(elementMethod) &&
            schemasElements(elementCall).some((element) => element === identifier)

          if (isObjectField || isStructuralElement) {
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
