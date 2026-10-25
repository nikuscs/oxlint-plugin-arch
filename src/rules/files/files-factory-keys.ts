import { defineRule } from '@oxlint/plugins'
import { declarationsFactories, declarationsPropertyName, declarationsReturnedObjects } from '../../utils/declarations.utils.ts'
import { optionsFirst, optionsPatternSchema, optionsPatternsTest, optionsPatternsWithEmpty } from '../../utils/options.utils.ts'
import type { FilesFactoryKeysCompiled, FilesFactoryKeysOptions } from '../../types/files.types.ts'
import type { OptionsPattern } from '../../types/options.types.ts'

function compileKeys(pattern: OptionsPattern, keys: string[], requireKeys: string[]): FilesFactoryKeysCompiled {
  const allowedList = keys.concat(requireKeys.filter((key) => !keys.includes(key)))

  return { patterns: optionsPatternsWithEmpty(pattern), allowed: new Set(allowedList), allowedList, requireKeys }
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
          factoryPattern: optionsPatternSchema,
          requireKeys: { type: 'array', items: { type: 'string' } },
          keySets: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                factoryPattern: optionsPatternSchema,
                keys: { type: 'array', items: { type: 'string' } },
                requireKeys: { type: 'array', items: { type: 'string' } },
              },
              required: ['factoryPattern', 'keys'],
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
        const { keys, factoryPattern = '^make[A-Z]', requireKeys = [], keySets: configured } = optionsFirst<FilesFactoryKeysOptions>(context, {})

        if (!keys && !configured) {
          return false
        }

        keySets = (configured ?? []).map((item) => compileKeys(item.factoryPattern, item.keys, item.requireKeys ?? []))

        if (keys) {
          keySets.push(compileKeys(factoryPattern, keys, requireKeys))
        }
      },
      Program(program) {
        for (const factory of declarationsFactories(program, /^/)) {
          const resolved = keySets.find((item) => optionsPatternsTest(item.patterns, factory.name))

          if (!resolved) {
            continue
          }

          for (const object of declarationsReturnedObjects(factory)) {
            const present = new Set<string>()

            if (object.properties.length === 0 && resolved.requireKeys.length > 0) {
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

            for (const key of resolved.requireKeys) {
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
