import { defineRule } from '@oxlint/plugins'
import { astDottedName, astStaticString } from '../../utils/ast.utils.ts'
import { declarationsPropertyName } from '../../utils/declarations.utils.ts'
import { namingCaptures, namingCaptureSchemaProperties, namingExpand } from '../../utils/naming.utils.ts'
import { optionsEscape, optionsFirst, optionsMessage, optionsPatternLabel, optionsPatterns, optionsPatternSchema, optionsPatternsTest, optionsWildcards } from '../../utils/options.utils.ts'
import type { NamingLabelsCompiled, NamingLabelsOptions } from '../../types/naming.types.ts'
import type { ESTree } from '@oxlint/plugins'

function namingLabelsRoot(node: ESTree.Node): string | undefined {
  return node.type === 'CallExpression' ? namingLabelsRoot(node.callee) : astDottedName(node)
}

function namingLabelsBinding(node: ESTree.Node, within: RegExp[]): string | undefined {
  const parent = node.parent

  if (!parent) {
    return undefined
  }

  if (parent.type === 'VariableDeclarator' && parent.init === node) {
    return parent.id.type === 'Identifier' ? parent.id.name : undefined
  }

  if ((parent.type === 'ClassDeclaration' || parent.type === 'ClassExpression') && parent.superClass === node) {
    return parent.id?.name
  }

  if ((parent.type === 'CallExpression' && parent.callee === node) || (parent.type === 'MemberExpression' && parent.object === node)) {
    return namingLabelsBinding(parent, within)
  }

  const owner = parent.type === 'CallExpression' && parent.callee.type === 'MemberExpression' ? astDottedName(parent.callee) : undefined

  return owner !== undefined && optionsPatternsTest(within, owner) ? owner.split('.').at(-2) : undefined
}

function namingLabelsTarget(first: ESTree.Node, property: string | undefined): ESTree.Node | undefined {
  if (property === undefined) {
    return first
  }

  const held = first.type === 'ObjectExpression' ? first.properties.find((item) => declarationsPropertyName(item) === property) : undefined

  return held?.type === 'Property' ? held.value : undefined
}

function namingLabelsPlain(text: string, loose: boolean | undefined): string {
  return loose ? text.replaceAll(/[._\-/\s]/g, '').toLowerCase() : text
}

function namingLabelsExpected({ entry, drop }: NamingLabelsCompiled, captures: Record<string, string>, binding: string): string[] {
  const name = drop.reduce((text, pattern) => text.replace(pattern, ''), binding)

  return [entry.name ?? []].flat().map((template) => namingExpand(template, { ...captures, name }, false))
}

export const namingLabels = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...namingCaptureSchemaProperties,
          message: { type: 'string' },
          labels: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                callee: optionsPatternSchema,
                property: { type: 'string' },
                name: optionsPatternSchema,
                pattern: optionsPatternSchema,
                drop: optionsPatternSchema,
                loose: { type: 'boolean' },
                within: optionsPatternSchema,
                message: { type: 'string' },
              },
              required: ['callee'],
              anyOf: [{ required: ['name'] }, { required: ['pattern'] }],
            },
          },
        },
        required: ['labels'],
      },
    ],
    messages: {
      name: "'{{label}}' must be '{{expected}}', after the name '{{name}}'.{{message}}",
      pattern: "'{{label}}' must match {{pattern}}.{{message}}",
    },
  },
  createOnce(context) {
    let entries: NamingLabelsCompiled[] = []
    let captures: Record<string, string> = {}
    let message: string | undefined

    return {
      before() {
        const options = optionsFirst<NamingLabelsOptions>(context, { labels: [] })
        const paths = namingCaptures(context.filename, options)

        if (!paths) {
          return false
        }

        captures = paths
        message = options.message

        entries = options.labels.map((entry) => ({
          callees: optionsWildcards(entry.callee),
          entry,
          drop: optionsPatterns(entry.drop),
          within: optionsWildcards(entry.within),
          patterns: [entry.pattern ?? []].flat().map((source) => namingExpand(source, paths, true, optionsEscape)),
        }))

        if (entries.length === 0) {
          return false
        }
      },
      CallExpression(node) {
        const root = namingLabelsRoot(node.callee)
        const first = node.arguments.at(0)

        if (root === undefined || !first) {
          return
        }

        for (const compiled of entries) {
          const target = optionsPatternsTest(compiled.callees, root) ? namingLabelsTarget(first, compiled.entry.property) : undefined
          const label = target ? astStaticString(target) : undefined

          if (!target || label === undefined) {
            continue
          }

          if (compiled.patterns.length > 0 && !optionsPatternsTest(optionsPatterns(compiled.patterns), label)) {
            context.report({
              node: target,
              messageId: 'pattern',
              data: { label, pattern: optionsPatternLabel(compiled.patterns), message: optionsMessage(compiled.entry.message, message) },
            })
          }

          const binding = namingLabelsBinding(node, compiled.within)
          const expected = binding === undefined ? [] : namingLabelsExpected(compiled, captures, binding)
          const plain = expected.map((item) => namingLabelsPlain(item, compiled.entry.loose))

          if (binding !== undefined && expected.length > 0 && !plain.includes(namingLabelsPlain(label, compiled.entry.loose))) {
            context.report({
              node: target,
              messageId: 'name',
              data: { label, expected: expected.join(' or '), name: binding, message: optionsMessage(compiled.entry.message, message) },
            })
          }
        }
      },
    }
  },
})
