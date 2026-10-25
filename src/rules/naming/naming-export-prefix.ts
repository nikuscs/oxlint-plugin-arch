import { defineRule } from '@oxlint/plugins'
import { declarationsNamed, declarationsPublicServiceMethods, declarationsUnique } from '../../utils/declarations.utils.ts'
import { exportsCollect } from '../../utils/exports.utils.ts'
import { namingFilePrefixesFor, namingHasFilePrefix, namingStemSchemaProperties } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { DeclarationsNamed } from '../../types/declarations.types.ts'
import type { NamingExportPrefixOptions } from '../../types/naming.types.ts'

export const namingExportPrefix = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...namingStemSchemaProperties,
          serviceMethods: { type: 'boolean' },
          allFunctions: { type: 'boolean' },
          allDeclarations: { type: 'boolean' },
          allowPattern: optionsPatternSchema,
        },
      },
    ],
    messages: {
      prefix: "'{{name}}' must start with file prefix '{{prefix}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const options = optionsFirst<NamingExportPrefixOptions>(context, { stem: 'before-first-dot', normalize: 'remove-separators' })
        const prefixes = namingFilePrefixesFor(context.filename, options)
        const allowed = optionsPatterns(options.allowPattern)

        const names: Pick<DeclarationsNamed, 'name' | 'node'>[] = options.allDeclarations
          ? declarationsNamed(program)
          : exportsCollect(program).map((binding) => ({ name: binding.localName ?? binding.exportedName, node: binding.node }))

        if (options.allFunctions && !options.allDeclarations) {
          const exported = new Set(names.map((item) => item.name))
          names.push(
            ...declarationsNamed(program).filter(
              ({ name, node }) =>
                !exported.has(name) &&
                (node.type === 'FunctionDeclaration' ||
                  (node.type === 'VariableDeclarator' && (node.init?.type === 'ArrowFunctionExpression' || node.init?.type === 'FunctionExpression'))),
            ),
          )
        }

        if (options.serviceMethods) {
          names.push(...declarationsPublicServiceMethods(program))
        }

        for (const item of declarationsUnique(names)) {
          if (optionsPatternsTest(allowed, item.name) || namingHasFilePrefix(item.name, prefixes, options.normalize)) {
            continue
          }

          context.report({
            node: item.node,
            messageId: 'prefix',
            data: { name: item.name, prefix: prefixes.join(' or ') },
          })
        }
      },
    }
  },
})
