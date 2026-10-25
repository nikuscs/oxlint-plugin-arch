import { defineRule } from '@oxlint/plugins'
import { optionsFirst } from '../../utils/options.utils.ts'
import {
  schemasIsConstruction,
  schemasIsRuntimeImport,
  schemasIsRuntimeReexport,
  schemasRuntimeImportLocals,
} from '../../utils/schemas.utils.ts'
import type { SchemasLocalOptions } from '../../types/schemas.types.ts'
import type { ESTree } from '@oxlint/plugins'

const defaultRuntimeImportMessage = 'Do not import runtime schema constructors from {{source}}; import a named schema instead.'
const defaultConstructionMessage = 'Do not construct schemas locally; import a named schema instead.'

function formatMessage(template: string, data: Record<string, string>): string {
  return Object.entries(data).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, value), template)
}

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
          allowIn: { type: 'array', items: { type: 'string' } },
          allowPathPatterns: { type: 'array', items: { type: 'string' } },
          message: { type: 'string' },
          runtimeImportMessage: { type: 'string' },
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

    function packages(): Set<string> {
      return new Set(optionsFirst<SchemasLocalOptions>(context, {}).packages ?? ['zod'])
    }

    function reportRuntimeImport(node: ESTree.Node, source: string) {
      const { message, runtimeImportMessage } = optionsFirst<SchemasLocalOptions>(context, {})
      const text = formatMessage(runtimeImportMessage ?? message ?? defaultRuntimeImportMessage, { source })
      context.report({
        node,
        messageId: 'runtimeImport',
        data: { message: text },
      })
    }

    return {
      before() {
        const { namespaces = ['z'], allowIn = [], allowPathPatterns = [] } = optionsFirst<SchemasLocalOptions>(context, {})
        const filename = context.filename.replaceAll('\\', '/')
        constructors = new Set(namespaces)
        if (allowIn.some((suffix) => filename.endsWith(suffix)) || allowPathPatterns.some((pattern) => new RegExp(pattern).test(filename))) {
          return false
        }
      },
      ImportDeclaration(node) {
        if (!schemasIsRuntimeImport(node, packages())) {
          return
        }

        for (const name of schemasRuntimeImportLocals(node)) {
          constructors.add(name)
        }
        reportRuntimeImport(node, node.source.value)
      },
      ExportNamedDeclaration(node) {
        if (node.source && schemasIsRuntimeReexport(node, packages())) {
          reportRuntimeImport(node, node.source.value)
        }
      },
      ExportAllDeclaration(node) {
        if (schemasIsRuntimeReexport(node, packages())) {
          reportRuntimeImport(node, node.source.value)
        }
      },
      CallExpression(node) {
        if (!schemasIsConstruction(node, constructors)) {
          return
        }

        const { message, constructionMessage } = optionsFirst<SchemasLocalOptions>(context, {})
        const text = formatMessage(constructionMessage ?? message ?? defaultConstructionMessage, {})
        context.report({
          node,
          messageId: 'construction',
          data: { message: text },
        })
      },
    }
  },
})
