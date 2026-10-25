import { defineRule } from '@oxlint/plugins'
import { astDottedName, astMemberName } from '../../utils/ast.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type {
  BoundariesTokenOwnerOptions,
  BoundariesTokenOwnerRestriction,
  BoundariesTokenOwnerTarget,
} from '../../types/boundaries.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const boundariesTokenOwner = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          token: { type: 'string' },
          allowIn: { type: 'array', items: { type: 'string' } },
          allowPathPatterns: { type: 'array', items: { type: 'string' } },
          restrictions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                token: { type: 'string' },
                member: { type: 'string' },
                allowIn: { type: 'array', items: { type: 'string' } },
                allowPathPatterns: { type: 'array', items: { type: 'string' } },
                message: { type: 'string' },
              },
              oneOf: [
                { required: ['token'], not: { required: ['member'] } },
                { required: ['member'], not: { required: ['token'] } },
              ],
            },
          },
        },
        anyOf: [{ required: ['token'] }, { required: ['restrictions'] }],
      },
    ],
    messages: {
      restricted: "'{{token}}' may only appear in configured owner paths.",
      restrictedWithMessage: "'{{token}}' may only appear in configured owner paths. {{custom}}",
    },
  },
  createOnce(context) {
    let targets: BoundariesTokenOwnerTarget[] = []

    function report(node: ESTree.Node, target: BoundariesTokenOwnerTarget): void {
      context.report({
        node,
        messageId: target.message === undefined ? 'restricted' : 'restrictedWithMessage',
        data: { token: target.value, custom: target.message ?? '' },
      })
    }

    return {
      before() {
        const filename = context.filename.replaceAll('\\', '/')
        const options = optionsFirst<BoundariesTokenOwnerOptions>(context)

        const single: BoundariesTokenOwnerRestriction[] = options.token
          ? [{ token: options.token, allowIn: options.allowIn, allowPathPatterns: options.allowPathPatterns }]
          : []

        targets = [...single, ...(options.restrictions ?? [])].flatMap((restriction): BoundariesTokenOwnerTarget[] => {
          const allowed =
            (restriction.allowIn ?? []).some((suffix) => filename.endsWith(suffix)) ||
            (restriction.allowPathPatterns ?? []).some((pattern) => new RegExp(pattern).test(filename))

          if (allowed) {
            return []
          }

          if (restriction.token) {
            return [{ kind: 'token', value: restriction.token, message: restriction.message }]
          }

          return restriction.member ? [{ kind: 'member', value: restriction.member, message: restriction.message }] : []
        })
        if (targets.length === 0) {
          return false
        }
      },
      Identifier(node) {
        const parent = node.parent
        const declaration = parent.type === 'ImportSpecifier' || parent.type === 'ImportDefaultSpecifier' || parent.type === 'ImportNamespaceSpecifier' ? parent.parent : undefined

        const typeImport =
          (parent.type === 'ImportSpecifier' && parent.importKind === 'type') ||
          (declaration?.type === 'ImportDeclaration' && declaration.importKind === 'type')

        if (typeImport) {
          return
        }

        for (const target of targets) {
          if (target.kind === 'token' && node.name === target.value) {
            report(node, target)
          }
        }
      },
      MemberExpression(node) {
        for (const target of targets) {
          if (target.kind !== 'member') {
            continue
          }

          const matches = target.value.startsWith('*.') ? astMemberName(node) === target.value.slice(2) : astDottedName(node) === target.value

          if (matches) {
            report(node, target)
          }
        }
      },
    }
  },
})
