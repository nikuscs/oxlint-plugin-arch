import { defineRule } from '@oxlint/plugins'
import { declarationsIdName, declarationsKindOf } from '../../utils/declarations.utils.ts'
import { namingCaptures, namingExpand, namingFilePrefixesFor, namingHasFilePrefix, namingStemSchemaProperties } from '../../utils/naming.utils.ts'
import { optionsAll, optionsEscape, optionsPatternLabel, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { DeclarationsKind } from '../../types/declarations.types.ts'
import type { NamingDeclarationsCheck, NamingDeclarationsOptions } from '../../types/naming.types.ts'
import type { ESTree } from '@oxlint/plugins'

const namingDeclarationsKinds: readonly DeclarationsKind[] = ['function', 'const', 'let', 'var', 'class', 'type', 'interface', 'enum']

export const namingDeclarations = defineRule({
  meta: {
    type: 'problem',
    schema: {
      type: 'array',
      items: {
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
    },
    messages: {
      prefix: "'{{name}}' must start with file prefix '{{prefix}}'.",
      pattern: "'{{name}}' must match {{pattern}}.",
    },
  },
  createOnce(context) {
    let checks: NamingDeclarationsCheck[] = []

    function check(node: ESTree.Node) {
      const declarator = node.type === 'VariableDeclarator'
      const kind = declarationsKindOf(node, declarator ? [node.parent] : [])
      const name = declarationsIdName(node)
      const loop = declarator ? node.parent.parent : null
      const loopHeader = loop?.type === 'ForStatement' ? loop.init === node.parent : (loop?.type === 'ForInStatement' || loop?.type === 'ForOfStatement') && loop.left === node.parent

      if (!kind || !name || loopHeader) {
        return
      }

      for (const { kinds, allowed, expected, prefixes, label, normalize } of checks) {
        if ((kinds && !kinds.has(kind)) || optionsPatternsTest(allowed, name)) {
          continue
        }

        if (expected.length > 0) {
          if (!optionsPatternsTest(expected, name)) {
            context.report({
              node,
              messageId: 'pattern',
              data: { name, pattern: label },
            })
          }

          continue
        }

        if (!namingHasFilePrefix(name, prefixes, normalize)) {
          context.report({
            node,
            messageId: 'prefix',
            data: { name, prefix: prefixes.join(' or ') },
          })
        }
      }
    }

    return {
      before() {
        const given = optionsAll<NamingDeclarationsOptions>(context)
        const captures = namingCaptures(context.filename) ?? {}

        checks = (given.length > 0 ? given : [{}]).map((options) => {
          const sources = options.pattern === undefined ? [] : [options.pattern].flat().map((source) => namingExpand(source, captures, true, optionsEscape))

          return {
            kinds: options.kinds?.length ? new Set(options.kinds) : null,
            allowed: optionsPatterns(options.allow),
            expected: optionsPatterns(sources, options.flags),
            prefixes: namingFilePrefixesFor(context.filename, options),
            label: optionsPatternLabel(sources),
            normalize: options.normalize,
          }
        })
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
