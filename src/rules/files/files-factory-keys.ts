import { defineRule } from '@oxlint/plugins'
import { astDeclaration, astNearestFunction, astVisit } from '../../utils/ast.utils.ts'
import { declarationsIsFunctionValue, declarationsPropertyName } from '../../utils/declarations.utils.ts'
import { optionsFirst, optionsPatternSchema, optionsPatternsTest, optionsPatternsWithEmpty } from '../../utils/options.utils.ts'
import type { DeclarationsFunction } from '../../types/declarations.types.ts'
import type { FilesFactoryKeysCompiled, FilesFactoryKeysOptions } from '../../types/files.types.ts'
import type { OptionsPattern } from '../../types/options.types.ts'
import type { ESTree } from '@oxlint/plugins'

function compileKeys(pattern: OptionsPattern, keys: string[], requireKeys: string[]): FilesFactoryKeysCompiled {
  const allowedList = keys.concat(requireKeys.filter((key) => !keys.includes(key)))

  return { patterns: optionsPatternsWithEmpty(pattern), allowed: new Set(allowedList), allowedList, required: requireKeys }
}

export const filesFactoryKeys = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          keys: { type: 'array', items: { type: 'string' } },
          factory: optionsPatternSchema,
          required: { type: 'array', items: { type: 'string' } },
          sets: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                factory: optionsPatternSchema,
                keys: { type: 'array', items: { type: 'string' } },
                required: { type: 'array', items: { type: 'string' } },
              },
              required: ['factory', 'keys'],
            },
          },
        },
      },
    ],
    messages: {
      extraKey: "Factory '{{factory}}' must not return key '{{key}}'; allowed keys: {{allowed}}.",
      missingKey: "Factory '{{factory}}' must return key '{{key}}'.",
      emptyObject: "Factory '{{factory}}' must not return an empty object.",
    },
  },
  createOnce(context) {
    let keySets: FilesFactoryKeysCompiled[] = []

    return {
      before() {
        const { keys, factory = '^make[A-Z]', required = [], sets: configured } = optionsFirst<FilesFactoryKeysOptions>(context, {})

        if (!keys && !configured) {
          return false
        }

        keySets = (configured ?? []).map((item) => compileKeys(item.factory, item.keys, item.required ?? []))

        if (keys) {
          keySets.push(compileKeys(factory, keys, required))
        }
      },
      Program(program) {
        const factories = program.body.flatMap((statement): DeclarationsFunction[] => {
          const declaration = astDeclaration(statement)

          if (declaration?.type === 'FunctionDeclaration') {
            return [{ name: declaration.id?.name ?? '<anonymous>', node: declaration }]
          }

          if (declaration?.type !== 'VariableDeclaration') {
            return []
          }

          return declaration.declarations.flatMap((item) =>
            item.id.type === 'Identifier' && declarationsIsFunctionValue(item.init) ? [{ name: item.id.name, node: item.init }] : [],
          )
        })

        for (const factory of factories) {
          const resolved = keySets.find((item) => optionsPatternsTest(item.patterns, factory.name))

          if (!resolved) {
            continue
          }

          const objects: ESTree.ObjectExpression[] = []

          if (factory.node.type === 'ArrowFunctionExpression' && factory.node.body.type === 'ObjectExpression') {
            objects.push(factory.node.body)
          } else {
            astVisit(factory.node.body, [factory.node], (node, ancestors) => {
              if (node.type === 'ReturnStatement' && node.argument?.type === 'ObjectExpression' && astNearestFunction(ancestors) === factory.node) {
                objects.push(node.argument)
              }
            })
          }

          for (const object of objects) {
            const present = new Set<string>()

            if (object.properties.length === 0 && resolved.required.length > 0) {
              context.report({
                node: object,
                messageId: 'emptyObject',
                data: { factory: factory.name },
              })
            }

            for (const property of object.properties) {
              const key = declarationsPropertyName(property)

              if (key) {
                present.add(key)
              }

              if (!key || !resolved.allowed.has(key)) {
                context.report({
                  node: property,
                  messageId: 'extraKey',
                  data: { factory: factory.name, key: key ?? '<computed or spread>', allowed: resolved.allowedList.join(', ') },
                })
              }
            }

            for (const key of resolved.required) {
              if (!present.has(key)) {
                context.report({
                  node: object,
                  messageId: 'missingKey',
                  data: { factory: factory.name, key },
                })
              }
            }
          }
        }
      },
    }
  },
})
