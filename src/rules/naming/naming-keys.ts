import { defineRule } from '@oxlint/plugins'
import { astDottedName, astMemberName } from '../../utils/ast.utils.ts'
import { declarationsPropertyName } from '../../utils/declarations.utils.ts'
import { namingCaptures, namingExpand } from '../../utils/naming.utils.ts'
import { optionsEscape, optionsFirst, optionsPatternLabel, optionsPatterns, optionsPatternSchema, optionsPatternsTest, optionsWildcards } from '../../utils/options.utils.ts'
import type { NamingKeysOptions } from '../../types/naming.types.ts'
import type { ESTree } from '@oxlint/plugins'

function namingKeysName(value: ESTree.Node): string | undefined {
  if (value.type === 'MemberExpression') {
    return astMemberName(value)
  }

  return value.type === 'Identifier' ? value.name : undefined
}

function namingKeysSources(templates: NamingKeysOptions['name'], captures: Record<string, string>, keys: string[]): string[] {
  return [templates].flat().map((source) => namingExpand(source, { ...captures, path: keys.join('-') }, true, optionsEscape))
}

export const namingKeys = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          callees: { type: 'array', items: { type: 'string' }, minItems: 1 },
          name: optionsPatternSchema,
        },
        required: ['callees', 'name'],
      },
    ],
    messages: {
      name: "'{{name}}' under key '{{path}}' must match {{pattern}}.",
    },
  },
  createOnce(context) {
    let options: NamingKeysOptions = { callees: [], name: [] }
    let captures: Record<string, string> = {}
    let callees: RegExp[] = []

    function check(object: ESTree.ObjectExpression, path: string[]): void {
      for (const property of object.properties) {
        const key = declarationsPropertyName(property)

        if (property.type !== 'Property' || key === undefined) {
          continue
        }

        const { value } = property
        const keys = [...path, key]

        if (value.type === 'ObjectExpression') {
          check(value, keys)

          continue
        }

        const name = namingKeysName(value)

        if (name === undefined) {
          continue
        }

        const sources = namingKeysSources(options.name, captures, keys)

        if (!optionsPatternsTest(optionsPatterns(sources), name)) {
          context.report({
            node: value,
            messageId: 'name',
            data: { name, path: keys.join('.'), pattern: optionsPatternLabel(sources) },
          })
        }
      }
    }

    return {
      before() {
        options = optionsFirst<NamingKeysOptions>(context, { callees: [], name: [] })
        captures = namingCaptures(context.filename) ?? {}
        callees = optionsWildcards(options.callees)

        if (options.callees.length === 0) {
          return false
        }
      },
      CallExpression(node) {
        const first = node.arguments.at(0)

        if (first?.type === 'ObjectExpression' && optionsPatternsTest(callees, astDottedName(node.callee) ?? '')) {
          check(first, [])
        }
      },
    }
  },
})
