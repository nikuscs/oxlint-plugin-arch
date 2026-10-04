import { defineRule } from '@oxlint/plugins'
import { astDottedName, astStaticMemberName, namingPosixPath, optionsFirst } from '../utils/index.ts'
import type { ESTree } from '@oxlint/plugins'

interface NoRestrictedTokenRestriction {
  token?: string
  member?: string
  allowIn?: string[]
  allowPathPatterns?: string[]
  message?: string
}

interface NoRestrictedTokenOptions extends NoRestrictedTokenRestriction {
  restrictions?: NoRestrictedTokenRestriction[]
}

interface NormalizedRestriction {
  kind: 'token' | 'member'
  value: string
  message?: string
}

function tokenIsTypeOnlyImport(node: ESTree.Node): boolean {
  const parent = node.parent

  if (parent?.type === 'ImportSpecifier') {
    return (
      parent.importKind === 'type' ||
      (parent.parent.type === 'ImportDeclaration' && parent.parent.importKind === 'type')
    )
  }

  return (
    (parent?.type === 'ImportDefaultSpecifier' || parent?.type === 'ImportNamespaceSpecifier') &&
    parent.parent.type === 'ImportDeclaration' &&
    parent.parent.importKind === 'type'
  )
}

// Why: a `*.` wildcard must match any receiver, including `this.db`, call results
// in builder chains, and computed objects, so only the property name is compared.
function memberMatches(node: ESTree.MemberExpression, restriction: string): boolean {
  return restriction.startsWith('*.')
    ? astStaticMemberName(node) === restriction.slice(2)
    : astDottedName(node) === restriction
}

/**
 * Restricts identifiers or dotted member accesses to configured owner paths while leaving path selection to the consumer.
 *
 * Example: `RouterClient` can be allowed in `rpc.client.ts`, and `*.insertInto` in repository files, and rejected everywhere else.
 */
export const noRestrictedToken = defineRule({
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
    let restrictions: NormalizedRestriction[] = []

    function report(node: ESTree.Node, restriction: NormalizedRestriction): void {
      context.report({
        node,
        messageId: restriction.message === undefined ? 'restricted' : 'restrictedWithMessage',
        data: { token: restriction.value, custom: restriction.message ?? '' },
      })
    }

    return {
      before() {
        const options = optionsFirst<NoRestrictedTokenOptions>(context)
        const configured = [
          ...(options.token
            ? [
                {
                  token: options.token,
                  allowIn: options.allowIn,
                  allowPathPatterns: options.allowPathPatterns,
                },
              ]
            : []),
          ...(options.restrictions ?? []),
        ]
        const filename = namingPosixPath(context.filename)

        restrictions = configured.flatMap((restriction): NormalizedRestriction[] => {
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

        if (restrictions.length === 0) {
          return false
        }
      },
      Identifier(node) {
        if (tokenIsTypeOnlyImport(node)) {
          return
        }

        for (const restriction of restrictions) {
          if (restriction.kind === 'token' && node.name === restriction.value) {
            report(node, restriction)
          }
        }
      },
      MemberExpression(node) {
        for (const restriction of restrictions) {
          if (restriction.kind === 'member' && memberMatches(node, restriction.value)) {
            report(node, restriction)
          }
        }
      },
    }
  },
})
