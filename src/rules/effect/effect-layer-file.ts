import { defineRule } from '@oxlint/plugins'
import { astDeclaration, astDottedName, astIsInlineFunction, astUnwrap, astVisit } from '../../utils/ast.utils.ts'
import { effectBuilders, effectGenerator, effectIsBuilder, effectMatches } from '../../utils/effect.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { EffectLayerFileOptions } from '../../types/effect.types.ts'
import type { ESTree } from '@oxlint/plugins'

const effectLayerFileDefaultLayers = ['^Layer\\.', '^HttpRouter\\.add(?:All)?$', '(?:^|\\.)layer[^.]*$']

const effectLayerFileDefaultServices = ['(?:^|\\.)of$', '^Context\\.']

const effectLayerFileDefaultConstructors = [
  'Layer.effect',
  'Layer.effectContext',
  'Layer.effectDiscard',
  'Layer.scoped',
  'Layer.scopedContext',
  'Layer.scopedDiscard',
  'Layer.sync',
  'Layer.unwrap',
]

export const effectLayerFile = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          layer: { type: 'string' },
          make: { type: 'string' },
          prefix: { type: 'string' },
          builders: { type: 'array', items: { type: 'string' } },
          layers: optionsPatternSchema,
          services: optionsPatternSchema,
          constructors: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
    messages: {
      missing: 'A layer file exports `{{layer}}`.',
      notLayer: '`{{layer}}` is built with Layer: a Layer call, a Layer pipe, or a function returning one.',
      builderName: 'The Effect that builds the service is named `{{make}}`, one per layer file.',
      moduleMethod: 'Only `{{make}}` is an Effect at module level; move this into `{{make}}`, or into a utils file if two files use it.',
      moduleHelper: 'A layer file holds only `{{make}}`, {{prefix}}<Role> layers and `{{layer}}`; move this into `{{make}}`, or into a utils file if two files use it.',
      localLayer: 'A Layer other than `{{layer}}` is named {{prefix}}<Role> and is not exported.',
      makeReturn: '`{{make}}` returns the service through its tag (Tag.of({ … })), a Context, or a Layer.',
      inlineBuilder: 'Build this layer from `{{make}}`, not an inline Effect: Layer.effect(Tag, {{make}}). One built layer per file.',
    },
  },
  createOnce(context) {
    let layer = 'layer'
    let make = 'make'
    let prefix = 'layer'
    let builders = new Set(effectBuilders)
    let layers: RegExp[] = []
    let services: RegExp[] = []
    let constructors = new Set(effectLayerFileDefaultConstructors)

    const returned = (node: ESTree.Expression | null | undefined): ESTree.Expression | null | undefined => {
      const value = node ? astUnwrap(node) : node

      if (!value || !astIsInlineFunction(value)) {
        return value
      }

      return value.body?.type === 'BlockStatement'
        ? returned(value.body.body.findLast((statement) => statement.type === 'ReturnStatement')?.argument)
        : returned(value.body)
    }

    return {
      before() {
        const options = optionsFirst<EffectLayerFileOptions>(context, {})
        layer = options.layer ?? 'layer'
        make = options.make ?? 'make'
        prefix = options.prefix ?? 'layer'
        builders = new Set(options.builders ?? effectBuilders)
        constructors = new Set(options.constructors ?? effectLayerFileDefaultConstructors)
        layers = optionsPatterns(options.layers ?? effectLayerFileDefaultLayers)
        services = [...optionsPatterns(options.services ?? effectLayerFileDefaultServices), ...layers]
      },
      Program(program) {
        const data = { layer, make, prefix }

        const declarators = program.body.flatMap((statement) => {
          const declaration = astDeclaration(statement)
          const exported = statement.type === 'ExportNamedDeclaration'

          return declaration?.type === 'VariableDeclaration'
            ? declaration.declarations.map((node) => ({ exported, node, name: node.id.type === 'Identifier' ? node.id.name : '' }))
            : []
        })

        const exportedLayer = declarators.find(({ exported, name }) => exported && name === layer)

        if (!exportedLayer) {
          context.report({
            node: program,
            messageId: 'missing',
            data,
          })
        } else if (!effectMatches(returned(exportedLayer.node.init), layers)) {
          context.report({
            node: exportedLayer.node,
            messageId: 'notLayer',
            data,
          })
        }

        const wired = new Set<string>()
        const wiring = declarators.filter((item) => item === exportedLayer || effectMatches(item.node.init, layers))

        astVisit(wiring.map(({ node }) => node.init), [], (call) => {
          if (call.type !== 'CallExpression' || !optionsPatternsTest(layers, astDottedName(call.callee) ?? '')) {
            return
          }

          for (const argument of call.arguments) {
            const target = argument.type === 'CallExpression' ? argument.callee : argument

            if (target.type === 'Identifier') {
              wired.add(target.name)
            }
          }
        })

        const locals = declarators.filter(({ exported }) => !exported)
        const effects = locals.filter(({ node }) => effectIsBuilder(node.init, builders))
        const builder = effects.find(({ name }) => name === make) ?? effects.find(({ name }) => wired.has(name))

        if (builder && builder.name !== make) {
          context.report({
            node: builder.node,
            messageId: 'builderName',
            data,
          })
        }

        for (const { node, name, exported } of declarators) {
          const isLayer = effectMatches(node.init, layers)
          const isEffect = effectIsBuilder(node.init, builders)

          if (!exported && isEffect && name !== builder?.name) {
            context.report({
              node,
              messageId: 'moduleMethod',
              data,
            })
          }

          if (!exported && !isEffect && !isLayer && name !== make) {
            context.report({
              node,
              messageId: 'moduleHelper',
              data,
            })
          }

          if (isLayer && name !== layer && (exported || !name.startsWith(prefix) || !/^[A-Z]\w*$/.test(name.slice(prefix.length)))) {
            context.report({
              node,
              messageId: 'localLayer',
              data,
            })
          }
        }

        for (const statement of program.body) {
          if (statement.type === 'FunctionDeclaration') {
            context.report({
              node: statement,
              messageId: 'moduleHelper',
              data,
            })
          }
        }

        const generator = builder?.name === make ? effectGenerator(builder.node.init, builders) : undefined

        for (const statement of generator?.body?.body ?? []) {
          if (statement.type === 'ReturnStatement' && !effectMatches(statement.argument, services)) {
            context.report({
              node: statement,
              messageId: 'makeReturn',
              data,
            })
          }
        }
      },
      CallExpression(node) {
        if (!constructors.has(astDottedName(node.callee) ?? '')) {
          return
        }

        for (const argument of node.arguments) {
          if (argument.type !== 'SpreadElement' && (astIsInlineFunction(astUnwrap(argument)) || effectIsBuilder(argument, builders))) {
            context.report({
              node: argument,
              messageId: 'inlineBuilder',
              data: { layer, make, prefix },
            })
          }
        }
      },
    }
  },
})
