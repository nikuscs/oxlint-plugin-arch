import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'

const FORBIDDEN_SYMBOL_NAME = 'shape'

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
    messages: {
      forbiddenSymbolName: 'Rename symbol "{{name}}" for its domain role; "shape" describes structure rather than ownership.',
    },
  },
  createOnce(context) {
    const reportForbiddenSymbolName = (node: ESTree.Node & { name: string }) => {
      if (!node.name.toLowerCase().includes(FORBIDDEN_SYMBOL_NAME) || namesForeignApi(node)) {
        return
      }
      context.report({
        node,
        messageId: 'forbiddenSymbolName',
        data: { name: node.name },
      })
    }

    return {
      Identifier: reportForbiddenSymbolName,
      PrivateIdentifier: reportForbiddenSymbolName,
      JSXIdentifier: reportForbiddenSymbolName,
    }
  },
})
