import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../../utils/options.utils.ts'
import type { DillonAntiSlopSymbolNamesOptions } from '../../../types/dillon-anti-slop.types.ts'
import type { ESTree } from '@oxlint/plugins'

function namesForeignApi(node: ESTree.Node): boolean {
  const parent = node.parent

  if (!parent) {
    return false
  }

  if (parent.type === 'MemberExpression') {
    return parent.property === node && !parent.computed
  }

  if (parent.type === 'TSQualifiedName') {
    return parent.right === node
  }

  if (parent.type === 'ImportSpecifier') {
    return parent.imported === node && parent.local !== node && 'name' in node && parent.local.name !== node.name
  }

  if (parent.type === 'ExportSpecifier') {
    return parent.local === node && parent.exported !== node && parent.parent.type === 'ExportNamedDeclaration' && parent.parent.source !== null
  }

  if (parent.type === 'JSXMemberExpression') {
    return parent.property === node
  }

  if (parent.type === 'JSXAttribute') {
    return parent.name === node
  }

  return parent.type === 'Property' && parent.key === node && !parent.computed && (parent.shorthand || parent.parent.type === 'ObjectPattern')
}

export const noForbiddenTermInSymbolNamesRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow the case-insensitive substring "shape" in JavaScript, TypeScript, private, and JSX symbol names.',
    },
    schema: [{ type: 'object', additionalProperties: false, properties: { terms: { type: 'array', items: { type: 'string', minLength: 1 }, minItems: 1 } } }],
    messages: {
      forbiddenSymbolName: 'Rename symbol "{{name}}" for its domain role; "{{term}}" describes structure rather than ownership.',
    },
  },
  createOnce(context) {
    let terms: string[] = []

    const reportForbiddenSymbolName = (node: ESTree.Node & { name: string }) => {
      const lower = node.name.toLowerCase()
      const term = terms.find((candidate) => lower.includes(candidate))

      if (term === undefined || namesForeignApi(node)) {
        return
      }
      context.report({
        node,
        messageId: 'forbiddenSymbolName',
        data: { name: node.name, term },
      })
    }

    return {
      before() {
        terms = (optionsFirst<DillonAntiSlopSymbolNamesOptions>(context, {}).terms ?? ['shape']).map((term) => term.toLowerCase())
      },
      Identifier: reportForbiddenSymbolName,
      PrivateIdentifier: reportForbiddenSymbolName,
      JSXIdentifier: reportForbiddenSymbolName,
    }
  },
})
