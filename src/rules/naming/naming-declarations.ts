import { defineRule } from '@oxlint/plugins'
import { declarationsKinds, declarationsNamedFromNode } from '../../utils/declarations.utils.ts'
import { namingFilePrefixesFor, namingHasFilePrefix, namingStemSchemaProperties } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsPatternLabel, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { DeclarationsKind } from '../../types/declarations.types.ts'
import type { NamingDeclarationsOptions } from '../../types/naming.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const namingDeclarations = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          kinds: { type: 'array', items: { type: 'string', enum: [...declarationsKinds] } },
          pattern: optionsPatternSchema,
          flags: { type: 'string' },
          ...namingStemSchemaProperties,
          allowPattern: optionsPatternSchema,
        },
      },
    ],
    messages: {
      prefix: "'{{name}}' must start with file prefix '{{prefix}}'.",
      pattern: "'{{name}}' must match {{pattern}}.",
    },
  },
  createOnce(context) {
    let options: NamingDeclarationsOptions = {}
    let kinds: Set<DeclarationsKind> | null = null
    let allowed: RegExp[] = []
    let expected: RegExp[] = []
    let prefixes: string[] = []

    function check(node: ESTree.Node) {
      const item = declarationsNamedFromNode(node)

      if (!item || (kinds && !kinds.has(item.kind)) || optionsPatternsTest(allowed, item.name)) {
        return
      }

      if (expected.length > 0) {
        if (optionsPatternsTest(expected, item.name)) {
          return
        }

        const label = optionsPatternLabel([options.pattern ?? []].flat().filter((source) => source !== ''))
        context.report({
          node: item.node,
          messageId: 'pattern',
          data: { name: item.name, pattern: label },
        })

        return
      }

      if (namingHasFilePrefix(item.name, prefixes, options.normalize)) {
        return
      }
      context.report({
        node: item.node,
        messageId: 'prefix',
        data: { name: item.name, prefix: prefixes.join(' or ') },
      })
    }

    return {
      before() {
        options = optionsFirst<NamingDeclarationsOptions>(context, { stem: 'before-first-dot', normalize: 'remove-separators' })
        kinds = options.kinds?.length ? new Set(options.kinds) : null
        allowed = optionsPatterns(options.allowPattern)
        expected = optionsPatterns(options.pattern, options.flags)
        prefixes = namingFilePrefixesFor(context.filename, options)
      },
      FunctionDeclaration: check,
      ClassDeclaration: check,
      TSTypeAliasDeclaration: check,
      TSInterfaceDeclaration: check,
      TSEnumDeclaration: check,
      VariableDeclarator: check,
    }
  },
})
