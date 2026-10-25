import { defineRule } from '@oxlint/plugins'
import { basename, dirname } from 'node:path'
import { astUnwrap } from '../../utils/ast.utils.ts'
import { declarationsPublicServiceMethods } from '../../utils/declarations.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { FilesDomainConstantsOptions } from '../../types/files.types.ts'
import type { ESTree } from '@oxlint/plugins'

function isData(expression: ESTree.Expression): boolean {
  const value = astUnwrap(expression)

  if (value.type === 'Literal' || value.type === 'ArrayExpression' || value.type === 'ObjectExpression') {
    return true
  }

  if (value.type === 'TemplateLiteral') {
    return value.expressions.every(isData)
  }

  if (value.type === 'UnaryExpression') {
    return isData(value.argument)
  }

  if (value.type === 'BinaryExpression' || value.type === 'LogicalExpression') {
    return value.left.type !== 'PrivateIdentifier' && isData(value.left) && isData(value.right)
  }

  return (
    value.type === 'NewExpression' &&
    value.callee.type === 'Identifier' &&
    ['Map', 'Set'].includes(value.callee.name) &&
    value.arguments[0]?.type === 'ArrayExpression' &&
    value.arguments[0].elements.length > 0
  )
}

export const filesDomainConstants = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { includeData: { type: 'boolean' }, allowServiceMethods: { type: 'boolean' } },
      },
    ],
    messages: {
      forbidden: "'{{name}}' belongs in '{{file}}' under this module-data policy. Use a domain-prefixed name; do not invent a factory to silence the rule.",
    },
  },
  createOnce(context) {
    let includeData = false
    let serviceObjects = new Set<ESTree.VariableDeclarator>()

    return {
      Program(program) {
        const options = optionsFirst<FilesDomainConstantsOptions>(context, {})

        includeData = Boolean(options.includeData)
        serviceObjects = new Set(
          options.allowServiceMethods ? declarationsPublicServiceMethods(program).map((method) => method.binding) : [],
        )
      },
      VariableDeclarator(node) {
        const declaration = node.parent

        const moduleConst =
          declaration.type === 'VariableDeclaration' &&
          declaration.kind === 'const' &&
          (declaration.parent.type === 'Program' || declaration.parent.type === 'ExportNamedDeclaration')

        if (serviceObjects.has(node) || !moduleConst) {
          return
        }

        const name = node.id.type === 'Identifier' ? node.id.name : undefined

        if ((!name || !/^[A-Z][A-Z0-9_]+$/.test(name)) && (!includeData || !node.init || !isData(node.init))) {
          return
        }

        const file = context.filename.replaceAll('\\', '/')

        const owner =
          file.includes('/services/') && dirname(file).split('/').at(-1) !== 'services'
            ? basename(dirname(file))
            : basename(file)
              .split('.')[0]
              .replace(/-(?:action|query)$/, '')

        context.report({
          node,
          messageId: 'forbidden',
          data: { name: name ?? '<destructured binding>', file: `${owner}.constants.ts` },
        })
      },
    }
  },
})
