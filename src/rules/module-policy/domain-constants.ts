import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import type { ModuleDomainConstantsOptions } from '../../types/module-policy.types.ts'
import { declarationsPublicServiceMethods, optionsFirst, trivialUnwrap } from '../../utils/index.ts'

/** Move module data to domain constants; for example, a service's label table belongs in chat.constants.ts. */
export const domainConstants = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: { includeData: { type: 'boolean' }, allowServiceMethods: { type: 'boolean' } },
    }],
    messages: { forbidden: 'Move named module constants to the domain constants file.' },
  },
  createOnce(context) {
    let serviceObjects = new Set<ESTree.VariableDeclarator>()
    function data(expression: ESTree.Expression): boolean {
      const value = trivialUnwrap(expression)
      if (value.type === 'Literal' || value.type === 'ArrayExpression' || value.type === 'ObjectExpression') return true
      if (value.type === 'TemplateLiteral') return value.expressions.every(data)
      if (value.type === 'UnaryExpression') return data(value.argument)
      if (value.type === 'BinaryExpression' || value.type === 'LogicalExpression') return value.left.type !== 'PrivateIdentifier' && data(value.left) && data(value.right)
      return value.type === 'NewExpression' && value.callee.type === 'Identifier'
        && ['Map', 'Set'].includes(value.callee.name) && value.arguments[0]?.type === 'ArrayExpression'
        && value.arguments[0].elements.length > 0
    }
    return {
      Program(program) {
        serviceObjects = new Set(optionsFirst<ModuleDomainConstantsOptions>(context, {}).allowServiceMethods ? declarationsPublicServiceMethods(program).map((method) => method.binding) : [])
      },
      VariableDeclarator(node) {
        if (serviceObjects.has(node)) return
        const declaration = node.parent
        if (declaration.type !== 'VariableDeclaration' || declaration.kind !== 'const'
          || declaration.parent.type !== 'Program' && declaration.parent.type !== 'ExportNamedDeclaration') return
        const options = optionsFirst<ModuleDomainConstantsOptions>(context, {})
        if (node.id.type === 'Identifier' && /^[A-Z][A-Z0-9_]+$/.test(node.id.name)
          || options.includeData && node.init && data(node.init)) {
          context.report({ node, messageId: 'forbidden' })
        }
      },
    }
  },
})
