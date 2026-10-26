import { defineRule } from '@oxlint/plugins'
import { declarationsIdName, declarationsKindOf } from '../../utils/declarations.utils.ts'
import { namingFilePrefixesFor, namingHasFilePrefix, namingStemSchemaProperties } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsPatternLabel, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { DeclarationsKind } from '../../types/declarations.types.ts'
import type { NamingDeclarationsOptions } from '../../types/naming.types.ts'
import type { ESTree } from '@oxlint/plugins'

const namingDeclarationsKinds: readonly DeclarationsKind[] = ['function', 'const', 'let', 'var', 'class', 'type', 'interface', 'enum']

export const namingDeclarations = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          kinds: { type: 'array', items: { type: 'string', enum: [...namingDeclarationsKinds] } },
          pattern: optionsPatternSchema,
          flags: { type: 'string' },
          ...namingStemSchemaProperties,
          allow: optionsPatternSchema,
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
    let label = ''

    function check(node: ESTree.Node) {
      const declarator = node.type === 'VariableDeclarator'
      const kind = declarationsKindOf(node, declarator ? [node.parent] : [])
      const name = declarationsIdName(node)
      let insideLoop = false

      for (let current: ESTree.Node | null = declarator ? node.parent : null; current && !insideLoop; current = current.parent) {
        insideLoop = current.type === 'ForStatement' || current.type === 'ForInStatement' || current.type === 'ForOfStatement'
      }

      if (!kind || !name || insideLoop || (kinds && !kinds.has(kind)) || optionsPatternsTest(allowed, name)) {
        return
      }

      if (expected.length > 0) {
        if (optionsPatternsTest(expected, name)) {
          return
        }
        context.report({
          node,
          messageId: 'pattern',
          data: { name, pattern: label },
        })

        return
      }

      if (namingHasFilePrefix(name, prefixes, options.normalize)) {
        return
      }
      context.report({
        node,
        messageId: 'prefix',
        data: { name, prefix: prefixes.join(' or ') },
      })
    }

    return {
      before() {
        options = optionsFirst<NamingDeclarationsOptions>(context, { stem: 'before-first-dot', normalize: 'remove-separators' })
        kinds = options.kinds?.length ? new Set(options.kinds) : null
        allowed = optionsPatterns(options.allow)
        expected = optionsPatterns(options.pattern, options.flags)
        label = optionsPatternLabel(options.pattern)
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
