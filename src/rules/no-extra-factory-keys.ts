import { defineRule } from '@oxlint/plugins'
import {
  factoriesCollectTopLevel,
  factoriesDirectlyReturnedObjects,
  factoriesObjectPropertyName,
  optionsFirst,
} from '../utils/index.ts'

interface NoExtraFactoryKeysOptions {
  keys: string[]
  factoryPattern?: string
}

/**
 * Checks direct object returns from selected top-level factories and rejects keys outside the configured allow-list.
 *
 * Example: With `keys: [run]`, `return { run }` passes while `return { run, preview }` fails.
 */
export const noExtraFactoryKeys = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        keys: { type: 'array', items: { type: 'string' } },
        factoryPattern: { type: 'string' },
      },
      required: ['keys'],
    }],
    messages: {
      extraKey: "Factory '{{factory}}' must not return key '{{key}}'; allowed keys: {{allowed}}.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { keys, factoryPattern = '^make[A-Z]' } = optionsFirst<NoExtraFactoryKeysOptions>(context)

        for (const factory of factoriesCollectTopLevel(program, new RegExp(factoryPattern))) {
          for (const object of factoriesDirectlyReturnedObjects(factory)) {
            for (const property of object.properties) {
              const key = factoriesObjectPropertyName(property)

              if (!key || !keys.includes(key)) {
                context.report({
                  node: property,
                  messageId: 'extraKey',
                  data: { factory: factory.name, key: key ?? '<computed or spread>', allowed: keys.join(', ') },
                })
              }
            }
          }
        }
      },
    }
  },
})
