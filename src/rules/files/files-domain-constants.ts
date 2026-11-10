import { defineRule } from '@oxlint/plugins'
import { basename, dirname } from 'node:path'
import { astUnwrap } from '../../utils/ast.utils.ts'
import { declarationsPublicServiceMethods } from '../../utils/declarations.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
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
        properties: {
          data: { type: 'boolean' },
          services: { type: 'boolean' },
          pattern: { ...optionsPatternSchema, default: '^[A-Z][A-Z0-9_]+$' },
          folders: { type: 'array', items: { type: 'string', minLength: 1 }, default: ['services'] },
          roles: { type: 'array', items: { type: 'string', minLength: 1 }, default: ['action', 'query'] },
          file: { type: 'string', minLength: 1, default: '{domain}.constants.ts' },
        },
      },
    ],
    messages: {
      forbidden: "'{{name}}' belongs in '{{file}}' under this module-data policy. Use a domain-prefixed name; do not invent a factory to silence the rule.",
    },
  },
  createOnce(context) {
    let includeData = false
    let names: RegExp[] = []
    let folders: string[] = []
    let roles: string[] = []
    let target = ''
    let serviceObjects = new Set<ESTree.VariableDeclarator>()

    return {
      Program(program) {
        const options = optionsFirst<FilesDomainConstantsOptions>(context, {})

        includeData = Boolean(options.data)
        names = optionsPatterns(options.pattern ?? '^[A-Z][A-Z0-9_]+$')
        folders = options.folders ?? ['services']
        roles = options.roles ?? ['action', 'query']
        target = options.file ?? '{domain}.constants.ts'
        serviceObjects = new Set(
          options.services ? declarationsPublicServiceMethods(program).map((method) => method.binding) : [],
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

        if ((!name || !optionsPatternsTest(names, name)) && (!includeData || !node.init || !isData(node.init))) {
          return
        }

        const file = context.filename.replaceAll('\\', '/')
        const folder = basename(dirname(file))
        const stem = basename(file).split('.')[0]
        const role = roles.find((candidate) => stem.endsWith(`-${candidate}`))
        const domain = role ? stem.slice(0, -role.length - 1) : stem
        const owner = folders.some((candidate) => file.includes(`/${candidate}/`) && folder !== candidate) ? folder : domain

        context.report({
          node,
          messageId: 'forbidden',
          data: { name: name ?? '<destructured binding>', file: target.replaceAll('{domain}', owner) },
        })
      },
    }
  },
})
