import { defineRule } from '@oxlint/plugins'
import { astBindings, astDeclaration, astIsInlineFunction, astSome, astUnwrap } from '../../utils/ast.utils.ts'
import { effectBuilders, effectGenerator, effectIsBuilder, effectMatches } from '../../utils/effect.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema } from '../../utils/options.utils.ts'
import type { EffectValuesFirstOptions } from '../../types/effect.types.ts'
import type { ESTree } from '@oxlint/plugins'

const effectValuesFirstDefaultPinned = [
  '^Layer\\.',
  '^Context\\.',
  '^HttpRouter\\.add(?:All)?$',
  '(?:^|\\.)of$',
  '(?:^|\\.)layer[^.]*$',
  '^Schema\\.(?:asserts|decode\\w*|encode\\w*|is|isSchema|isSchemaError|resolveAnnotations)$',
]

export const effectValuesFirst = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          builders: { type: 'array', items: { type: 'string' } },
          pinned: optionsPatternSchema,
        },
      },
    ],
    messages: {
      value: '`{{name}}` is a value declared after `{{after}}`: declare values first, then helpers and methods.',
    },
  },
  createOnce(context) {
    let builders = new Set(effectBuilders)
    let pinned: RegExp[] = []

    const check = (statements: readonly ESTree.Program['body'][number][]) => {
      const tied = new Set<string>()
      let first: string | undefined
      let barrier = false

      for (const statement of statements) {
        const declaration = astDeclaration(statement)

        if (declaration?.type === 'FunctionDeclaration' && declaration.id) {
          tied.add(declaration.id.name)
          first ??= declaration.id.name
          continue
        }

        if (declaration?.type !== 'VariableDeclaration') {
          barrier ||= statement.type === 'ExpressionStatement' && first !== undefined
          continue
        }

        for (const declarator of declaration.declarations) {
          const init = declarator.init
          const names = astBindings(declarator.id).map((binding) => binding.name)
          const helper = Boolean(init && (astIsInlineFunction(astUnwrap(init)) || effectIsBuilder(init, builders)))
          const kept = helper || effectMatches(init, pinned) || astSome(init, (node) => node.type === 'Identifier' && tied.has(node.name))

          if (first !== undefined && !kept && !barrier) {
            context.report({
              node: declarator,
              messageId: 'value',
              data: { name: names.join(', '), after: first },
            })
          }

          if (kept) {
            names.forEach((name) => tied.add(name))
          }

          barrier ||= kept && first !== undefined && astSome(init, (node) => node.type === 'YieldExpression')
          first ??= helper ? names.join(', ') : undefined
        }
      }
    }

    const body = (init: ESTree.Expression | null) => {
      const value = init ? astUnwrap(init) : null
      const target = value && astIsInlineFunction(value) ? value : effectGenerator(value, builders)

      return target?.body?.type === 'BlockStatement' ? target.body.body : []
    }

    return {
      before() {
        const options = optionsFirst<EffectValuesFirstOptions>(context, {})
        builders = new Set(options.builders ?? effectBuilders)
        pinned = optionsPatterns(options.pinned ?? effectValuesFirstDefaultPinned)
      },
      Program(program) {
        check(program.body)

        for (const statement of program.body) {
          const declaration = astDeclaration(statement)

          if (declaration?.type === 'FunctionDeclaration') {
            check(declaration.body?.body ?? [])
          }

          if (declaration?.type === 'VariableDeclaration') {
            declaration.declarations.forEach((declarator) => check(body(declarator.init)))
          }
        }
      },
    }
  },
})
