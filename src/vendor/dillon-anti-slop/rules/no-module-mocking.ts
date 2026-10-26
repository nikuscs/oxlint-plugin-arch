import { defineRule } from '@oxlint/plugins'
import { astModuleName } from '../../../utils/ast.utils.ts'
import { optionsAssertMockingApis, optionsFirst } from '../../../utils/options.utils.ts'
import { resolveVariable } from '../shared/resolve-variable.ts'
import type * as DillonAntiSlopTypes from '../../../types/dillon-anti-slop.types.ts'
import type * as PluginsTypes from '@oxlint/plugins'

const moduleMockMethods = new Set(['doMock', 'mock', 'unstable_mockModule'])

const defaultDeny: DillonAntiSlopTypes.DillonAntiSlopDeniedApi[] = [
  { api: '*.mock' },
  { api: '*.doMock' },
  { api: '*.unstable_mockModule' },
]

function testFramework(
  sourceCode: PluginsTypes.SourceCode,
  expression: PluginsTypes.ESTree.Expression,
): DillonAntiSlopTypes.DillonAntiSlopTestFramework | null {
  if (expression.type !== 'Identifier') {
    return null
  }

  const name = expression.name === 'vi' || expression.name === 'jest' ? expression.name : null

  if (name !== null && sourceCode.isGlobalReference(expression)) {
    return name
  }

  const variable = resolveVariable(sourceCode, expression)

  if (variable === null || variable.defs.length === 0) {
    return name
  }

  for (const definition of variable.defs) {
    if (definition.type !== 'ImportBinding' || definition.parent?.type !== 'ImportDeclaration') {
      continue
    }

    const source = definition.parent.source.value
    const specifier = definition.node
    let imported: string | null = null

    if (specifier.type === 'ImportSpecifier') {
      imported = astModuleName(specifier.imported)
    }

    if (source === 'vitest' && imported === 'vi') {
      return 'vi'
    }

    if (source === '@jest/globals' && imported === 'jest') {
      return 'jest'
    }
  }

  return null
}

function propertyName(
  key: PluginsTypes.ESTree.Expression | PluginsTypes.ESTree.PrivateIdentifier,
  computed: boolean,
): string | null {
  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value
  }
  return !computed && key.type === 'Identifier' ? key.name : null
}

function apiParts(api: string): [string, string] {
  const dot = api.indexOf('.')
  return [api.slice(0, dot), api.slice(dot + 1)]
}

function apiMatches(pattern: string, api: string): boolean {
  if (pattern === '*') {
    return true
  }

  const [patternFramework, patternMethod] = apiParts(pattern)
  const [framework, method] = apiParts(api)
  return (
    (patternFramework === '*' || patternFramework === framework) && (patternMethod === '*' || patternMethod === method)
  )
}

export const noModuleMockingRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Vitest and Jest module mocking; tests must replace dependencies through real interfaces.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          deny: {
            type: 'array',
            items: {
              anyOf: [
                { type: 'string' },
                {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    api: { type: 'string' },
                    message: { type: 'string' },
                  },
                  required: ['api'],
                },
              ],
            },
          },
          allow: { type: 'array', items: { type: 'string' } },
          checkDestructured: { type: 'boolean' },
        },
      },
    ],
    messages: {
      moduleMock: 'Replace module mocking with dependency injection through a real interface, service layer, or faithful test implementation.',
      testDouble: 'Replace {{api}} with dependency injection through a real interface, service layer, or faithful test implementation.',
      custom: '{{message}}',
    },
  },
  createOnce(context) {
    let deny: DillonAntiSlopTypes.DillonAntiSlopDeniedApi[] = []
    let allow: string[] = []
    let checkDestructured = false
    return {
      before() {
        const options = optionsFirst<DillonAntiSlopTypes.DillonAntiSlopModuleMockingOptions>(context, {})
        deny = (options.deny ?? defaultDeny).map((entry) => (typeof entry === 'string' ? { api: entry } : entry))
        allow = options.allow ?? []
        checkDestructured = options.checkDestructured ?? false
        optionsAssertMockingApis([...deny.map((entry) => entry.api), ...allow])
      },
      CallExpression(node) {
        const { callee } = node
        let framework: DillonAntiSlopTypes.DillonAntiSlopTestFramework | null = null
        let method: string | null = null

        if (callee.type === 'MemberExpression') {
          framework = testFramework(context.sourceCode, callee.object)
          method = framework === null ? null : propertyName(callee.property, callee.computed)
        } else if (checkDestructured && callee.type === 'Identifier') {
          const definition = resolveVariable(context.sourceCode, callee)?.defs[0]

          const declarator =
            definition?.parent?.type === 'VariableDeclaration' && definition.parent.kind === 'const'
              ? definition.node
              : null

          if (declarator?.type === 'VariableDeclarator' && declarator.id.type === 'ObjectPattern' && declarator.init !== null) {
            framework = testFramework(context.sourceCode, declarator.init)

            const property =
              framework === null
                ? undefined
                : declarator.id.properties.find((candidate): candidate is PluginsTypes.ESTree.BindingProperty => {
                  if (candidate.type !== 'Property') {
                    return false
                  }

                  const binding = candidate.value.type === 'AssignmentPattern' ? candidate.value.left : candidate.value
                  return binding.type === 'Identifier' && binding.name === callee.name
                })

            method = property === undefined ? null : propertyName(property.key, property.computed)
          }
        }

        if (framework === null || method === null) {
          return
        }

        const api = `${framework}.${method}`

        if (allow.some((pattern) => apiMatches(pattern, api))) {
          return
        }

        const denied = deny.find((entry) => apiMatches(entry.api, api))

        if (denied === undefined) {
          return
        }

        if (denied.message !== undefined) {
          context.report({
            node,
            messageId: 'custom',
            data: { message: denied.message },
          })
          return
        }
        context.report({
          node,
          messageId: moduleMockMethods.has(apiParts(api)[1]) ? 'moduleMock' : 'testDouble',
          data: { api },
        })
      },
    }
  },
})
