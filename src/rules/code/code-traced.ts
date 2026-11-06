import { defineRule } from '@oxlint/plugins'
import { astDottedName, astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { CodeTracedOptions } from '../../types/code.types.ts'
import type { ESTree, Scope } from '@oxlint/plugins'

export const codeTraced = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          untraced: { type: 'array', items: { type: 'string' }, default: ['Effect.fnUntraced'] },
          exports: optionsPatternSchema,
          services: { type: 'array', items: { type: 'string' }, default: ['of'] },
          skip: optionsPatternSchema,
          message: { type: 'string' },
        },
      },
    ],
    messages: {
      surface: '{{message}}',
    },
  },
  createOnce(context) {
    let untraced = new Set<string>()
    let services = new Set<string>()
    let exported = true
    let skipped: RegExp[] = []
    let message = ''

    const isUntraced = (node: ESTree.Node | null | undefined) => node?.type === 'CallExpression' && untraced.has(astDottedName(node.callee) ?? '')

    const resolves = (value: ESTree.Node) => {
      if (value.type !== 'Identifier') {
        return isUntraced(value)
      }

      let scope: Scope | null = context.sourceCode.getScope(value)

      while (scope && !scope.set.has(value.name)) {
        scope = scope.upper
      }

      const declaration = scope?.set.get(value.name)?.defs.at(0)?.node
      return declaration?.type === 'VariableDeclarator' && isUntraced(declaration.init)
    }

    return {
      before() {
        const options = optionsFirst<CodeTracedOptions>(context, {})
        const files = optionsPatterns(options.exports)
        untraced = new Set(options.untraced ?? ['Effect.fnUntraced'])
        services = new Set(options.services ?? ['of'])
        exported = files.length === 0 || optionsPatternsTest(files, context.filename.replaceAll('\\', '/'))
        skipped = optionsPatterns(options.skip)
        message = options.message ?? `An exported function or service method gets a span: replace ${[...untraced].join(', ')} with its traced form.`
      },
      ExportNamedDeclaration(node) {
        if (!exported || node.declaration?.type !== 'VariableDeclaration') {
          return
        }

        for (const declarator of node.declaration.declarations) {
          if (isUntraced(declarator.init)) {
            context.report({
              node: declarator,
              messageId: 'surface',
              data: { message },
            })
          }
        }
      },
      CallExpression(node) {
        const service = node.arguments.at(0)
        const callee = node.callee

        if (callee.type !== 'MemberExpression' || !services.has(astMemberName(callee) ?? '') || service?.type !== 'ObjectExpression') {
          return
        }

        const tag = callee.object.type === 'MemberExpression' ? astMemberName(callee.object) : astDottedName(callee.object)

        if (optionsPatternsTest(skipped, tag ?? '')) {
          return
        }

        for (const property of service.properties) {
          if (property.type === 'Property' && resolves(property.value)) {
            context.report({
              node: property,
              messageId: 'surface',
              data: { message },
            })
          }
        }
      },
    }
  },
})
