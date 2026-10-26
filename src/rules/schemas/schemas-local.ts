import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { SchemasLocalOptions } from '../../types/schemas.types.ts'
import type { ESTree } from '@oxlint/plugins'

const schemasLocalImportMessage = 'Do not import runtime schema constructors from {{source}}; import a named schema instead.'
const schemasLocalConstructionMessage = 'Do not construct schemas locally; import a named schema instead.'
const schemasLocalCalls = ['config', 'prettifyError', 'treeifyError', 'flattenError', 'formatError']

export const schemasLocal = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          packages: { type: 'array', items: { type: 'string' } },
          namespaces: { type: 'array', items: { type: 'string' } },
          calls: { type: 'array', items: { type: 'string' } },
          allow: { type: 'array', items: { type: 'string' } },
          patterns: { type: 'array', items: { type: 'string' } },
          message: { type: 'string' },
          importMessage: { type: 'string' },
          constructionMessage: { type: 'string' },
        },
      },
    ],
    defaultOptions: [{ packages: ['zod'], namespaces: ['z'] }],
    messages: {
      runtimeImport: '{{message}}',
      construction: '{{message}}',
    },
  },
  createOnce(context) {
    let constructors = new Set<string>()
    let packages = new Set<string>()
    let calls = new Set<string>()
    let pending: { node: ESTree.ImportDeclaration; locals: string[] }[] = []
    let schemaUses = new Set<string>()
    let callUses = new Set<string>()
    let importMessage = schemasLocalImportMessage
    let constructionMessage = schemasLocalConstructionMessage

    function isAllowedCall(node: ESTree.Node, member: ESTree.Node | null): boolean {
      return (
        member?.type === 'MemberExpression' &&
        member.object === node &&
        !member.computed &&
        member.property.type === 'Identifier' &&
        calls.has(member.property.name) &&
        member.parent.type === 'CallExpression' &&
        member.parent.callee === member
      )
    }

    function isPackage(source: string): boolean {
      return packages.has(source) || [...packages].some((name) => source.startsWith(`${name}/`))
    }

    function reportRuntimeImport(node: ESTree.Node, source: string) {
      context.report({
        node,
        messageId: 'runtimeImport',
        data: { message: importMessage.replaceAll('{{source}}', source) },
      })
    }

    function checkReexport(node: ESTree.ExportNamedDeclaration | ESTree.ExportAllDeclaration) {
      if (!node.source || !isPackage(node.source.value) || node.exportKind === 'type') {
        return
      }

      if (node.type === 'ExportAllDeclaration' || node.specifiers.length === 0 || node.specifiers.some((specifier) => specifier.exportKind !== 'type')) {
        reportRuntimeImport(node, node.source.value)
      }
    }

    return {
      before() {
        const options = optionsFirst<SchemasLocalOptions>(context)
        const filename = context.filename.replaceAll('\\', '/')
        constructors = new Set(options.namespaces)
        packages = new Set(options.packages)
        calls = new Set(options.calls ?? schemasLocalCalls)
        pending = []
        schemaUses = new Set()
        callUses = new Set()
        importMessage = options.importMessage ?? options.message ?? schemasLocalImportMessage
        constructionMessage = options.constructionMessage ?? options.message ?? schemasLocalConstructionMessage
        if (
          (options.allow ?? []).some((suffix) => filename.endsWith(suffix)) ||
          (options.patterns ?? []).some((pattern) => new RegExp(pattern).test(filename))
        ) {
          return false
        }
      },
      ImportDeclaration(node) {
        if (!isPackage(node.source.value)) {
          return
        }

        const locals = node.importKind === 'type'
          ? []
          : node.specifiers.flatMap((specifier) => (specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type' ? [specifier.local.name] : []))

        if (node.specifiers.length === 0 ? node.importKind === 'type' : locals.length === 0) {
          return
        }

        for (const name of locals) {
          constructors.add(name)
        }

        if (locals.length === 0) {
          reportRuntimeImport(node, node.source.value)
          return
        }

        pending.push({ node, locals })
      },
      Identifier(node) {
        if (!constructors.has(node.name) || node.parent.type.startsWith('Import')) {
          return
        }

        if (isAllowedCall(node, node.parent)) {
          callUses.add(node.name)
          return
        }

        schemaUses.add(node.name)
      },
      'Program:exit'() {
        const runtime = pending.filter(({ locals }) => locals.some((name) => schemaUses.has(name) || !callUses.has(name)))

        for (const { node } of runtime) {
          reportRuntimeImport(node, node.source.value)
        }
      },
      ExportNamedDeclaration: checkReexport,
      ExportAllDeclaration: checkReexport,
      CallExpression(node) {
        let root: ESTree.Node = node.callee

        while (root.type === 'MemberExpression') {
          root = root.object
        }

        if (root.type !== 'Identifier' || !constructors.has(root.name) || (node.callee.type === 'MemberExpression' && node.callee.object === root && isAllowedCall(root, root.parent))) {
          return
        }
        context.report({
          node,
          messageId: 'construction',
          data: { message: constructionMessage },
        })
      },
    }
  },
})
