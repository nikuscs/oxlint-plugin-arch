import { defineRule } from '@oxlint/plugins'
import {
  namingPosixPath,
  optionsFirst,
  schemasIsConstruction,
  schemasIsRuntimeImport,
  schemasRuntimeImportLocals,
} from '../utils/index.ts'

interface NoLocalSchemaConstructionOptions {
  packages?: string[]
  namespaces?: string[]
  allowIn?: string[]
  allowPathPatterns?: string[]
  message?: string
  runtimeImportMessage?: string
  constructionMessage?: string
}

const defaultRuntimeImportMessage = 'Do not import runtime schema constructors from {{source}}; import a named schema instead.'
const defaultConstructionMessage = 'Do not construct schemas locally; import a named schema instead.'

function formatMessage(template: string, data: Record<string, string>): string {
  return Object.entries(data).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, value), template)
}

/**
 * Rejects runtime schema-library imports and local schema construction, while allowing imported named schemas.
 *
 * Example: `schemaResolver(userSchema)` passes after importing `userSchema`; `import { z } from 'zod'` and `z.object({})` fail.
 */
export const noLocalSchemaConstruction = defineRule({
  meta: {
    type: 'problem',
    schema: [{
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
    }],
    defaultOptions: [{
      packages: ['zod'],
      namespaces: ['z'],
    }],
    messages: {
      runtimeImport: '{{message}}',
      construction: '{{message}}',
    },
  },
  createOnce(context) {
    let constructors = new Set<string>()

    return {
      before() {
        const {
          namespaces = ['z'],
          allowIn = [],
          allowPathPatterns = [],
        } = optionsFirst<NoLocalSchemaConstructionOptions>(context, {})
        const filename = namingPosixPath(context.filename)
        constructors = new Set(namespaces)

        if (allowIn.some((suffix) => filename.endsWith(suffix))
          || allowPathPatterns.some((pattern) => new RegExp(pattern).test(filename))) {
          return false
        }
      },
      ImportDeclaration(node) {
        const {
          packages = ['zod'],
          message,
          runtimeImportMessage,
        } = optionsFirst<NoLocalSchemaConstructionOptions>(context, {})

        if (!schemasIsRuntimeImport(node, new Set(packages))) {
          return
        }

        for (const name of schemasRuntimeImportLocals(node)) {
          constructors.add(name)
        }

        context.report({
          node,
          messageId: 'runtimeImport',
          data: {
            message: formatMessage(
              runtimeImportMessage ?? message ?? defaultRuntimeImportMessage,
              { source: node.source.value },
            ),
          },
        })
      },
      CallExpression(node) {
        if (!schemasIsConstruction(node, constructors)) {
          return
        }

        const { message, constructionMessage } = optionsFirst<NoLocalSchemaConstructionOptions>(context, {})
        context.report({
          node,
          messageId: 'construction',
          data: {
            message: formatMessage(constructionMessage ?? message ?? defaultConstructionMessage, {}),
          },
        })
      },
    }
  },
})
