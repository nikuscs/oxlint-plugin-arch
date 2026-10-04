import { defineRule } from '@oxlint/plugins'
import {
  factoriesCollectTopLevel,
  factoriesDirectlyReturnedObjects,
  factoriesObjectPropertyName,
  optionsFirst,
  optionsPatterns,
  optionsPatternSchema,
  optionsPatternsTest,
} from '../utils/index.ts'
import type { OptionsPattern } from '../utils/index.ts'

interface NoExtraFactoryKeySet {
  factoryPattern: OptionsPattern
  keys: string[]
  requireKeys?: string[]
}

interface NoExtraFactoryKeysOptions {
  keys?: string[]
  factoryPattern?: OptionsPattern
  requireKeys?: string[]
  keySets?: NoExtraFactoryKeySet[]
}

interface CompiledFactoryKeys {
  patterns: RegExp[]
  allowed: Set<string>
  allowedList: string[]
  requireKeys: string[]
}

function compileFactoryKeys(pattern: OptionsPattern, keys: string[], requireKeys: string[]): CompiledFactoryKeys {
  const allowedList = keys.concat(requireKeys.filter((key) => !keys.includes(key)))
  return {
    patterns: optionsPatterns(pattern),
    allowed: new Set(allowedList),
    allowedList,
    requireKeys,
  }
}

/**
 * Checks direct object returns from selected top-level factories and rejects keys outside the configured allow-list.
 *
 * Example: With `keys: [run]`, `return { run }` passes while `return { run, preview }` fails. `requireKeys` reports missing keys and empty objects.
 */
export const noExtraFactoryKeys = defineRule({
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
    let keySets: CompiledFactoryKeys[] = []
    let fallback: CompiledFactoryKeys | undefined

    function resolveFactoryKeys(name: string): CompiledFactoryKeys | undefined {
      const matched = keySets.find((item) => optionsPatternsTest(item.patterns, name))
      if (matched) {
        return matched
      }

      if (fallback && optionsPatternsTest(fallback.patterns, name)) {
        return fallback
      }
    }

    return {
      before() {
        const options = optionsFirst<NoExtraFactoryKeysOptions>(context, {})
        const { keys, factoryPattern = '^make[A-Z]', requireKeys = [], keySets: configured } = options

        if (!keys && !configured) {
          return false
        }

        keySets = (configured ?? []).map((item) =>
          compileFactoryKeys(item.factoryPattern, item.keys, item.requireKeys ?? []),
        )
        fallback = keys ? compileFactoryKeys(factoryPattern, keys, requireKeys) : undefined
      },
      Program(program) {
        for (const factory of factoriesCollectTopLevel(program, /^/)) {
          const resolved = resolveFactoryKeys(factory.name)

          if (!resolved) {
            continue
          }

          for (const object of factoriesDirectlyReturnedObjects(factory)) {
            const present = new Set(
              object.properties.flatMap((property) => {
                const key = factoriesObjectPropertyName(property)
                return key ? [key] : []
              }),
            )

            if (object.properties.length === 0 && resolved.requireKeys.length > 0) {
              context.report({
                node: object,
                messageId: 'emptyObject',
                data: { factory: factory.name },
              })
            }

            for (const property of object.properties) {
              const key = factoriesObjectPropertyName(property)

              if (!key || !resolved.allowed.has(key)) {
                context.report({
                  node: property,
                  messageId: 'extraKey',
                  data: {
                    factory: factory.name,
                    key: key ?? '<computed or spread>',
                    allowed: resolved.allowedList.join(', '),
                  },
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
