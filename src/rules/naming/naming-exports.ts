import { defineRule } from '@oxlint/plugins'
import {
  declarationsFunctions,
  declarationsIsFunctionValue,
  declarationsNamed,
  declarationsPublicServiceMethods,
  declarationsUnique,
} from '../../utils/declarations.utils.ts'
import { exportsCollect, exportsFunctions } from '../../utils/exports.utils.ts'
import {
  namingBasename,
  namingCamelCase,
  namingFilePrefixesFor,
  namingHasFilePrefix,
  namingPascalCase,
  namingStemSchemaProperties,
} from '../../utils/naming.utils.ts'
import {
  optionsAll,
  optionsPatternLabel,
  optionsPatterns,
  optionsPatternSchema,
  optionsPatternsTest,
  optionsPatternsWithEmpty,
} from '../../utils/options.utils.ts'
import type { DeclarationsNamed } from '../../types/declarations.types.ts'
import type { ExportsBinding } from '../../types/exports.types.ts'
import type { NamingExportsOptions } from '../../types/naming.types.ts'
import type { OptionsSchemaProperties } from '../../types/options.types.ts'

const namingExportsScopeProperties: OptionsSchemaProperties = {
  scope: { type: 'string', enum: ['exports', 'functions', 'declarations'] },
  types: { type: 'boolean' },
  services: { type: 'boolean' },
  allow: optionsPatternSchema,
}

function matchTemplate(
  basename: string,
  template: string,
  placeholder = '[a-z0-9-]+',
): Record<string, string> | null {
  let pattern = ''
  let index = 0

  while (index < template.length) {
    const char = template[index]

    if (char === '{') {
      const end = template.indexOf('}', index)

      if (end === -1) {
        return null
      }
      pattern += `(?<${template.slice(index + 1, end)}>${placeholder})`
      index = end + 1
      continue
    }
    pattern += /[.+^${}()|[\]\\]/.test(char) ? `\\${char}` : char
    index += 1
  }

  return new RegExp(`^${pattern}$`).exec(basename)?.groups ?? null
}

export const namingExports = defineRule({
  meta: {
    type: 'problem',
    schema: {
      type: 'array',
      items: {
        anyOf: [
          {
            type: 'object',
            additionalProperties: false,
            properties: { mode: { type: 'string', enum: ['prefix'] }, ...namingExportsScopeProperties, ...namingStemSchemaProperties },
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              mode: { type: 'string', enum: ['pattern'] },
              ...namingExportsScopeProperties,
              pattern: optionsPatternSchema,
              flags: { type: 'string' },
            },
            required: ['mode', 'pattern'],
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              mode: { type: 'string', enum: ['template'] },
              ...namingExportsScopeProperties,
              file: { type: 'string' },
              export: { type: 'string' },
              match: { type: 'string', enum: ['all', 'some'] },
              placeholder: { type: 'string' },
              camelCase: { type: 'boolean' },
            },
            required: ['mode', 'file', 'export'],
          },
        ],
      },
    },
    messages: {
      prefix: "'{{name}}' must start with file prefix '{{prefix}}'.",
      pattern: "'{{name}}' must match {{pattern}}.",
      mismatch: "Function '{{actual}}' must be named '{{expected}}' for file '{{file}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const checks = optionsAll<NamingExportsOptions>(context)
        let bindings: ExportsBinding[] | undefined
        let declarations: DeclarationsNamed[] | undefined

        for (const options of checks.length > 0 ? checks : [{}]) {
          const scope = options.scope ?? 'exports'
          const allowed = optionsPatterns(options.allow)

          if (options.mode === 'template') {
            const file = namingBasename(context.filename)
            const groups = matchTemplate(file, options.file, options.placeholder)

            if (!groups) {
              continue
            }

            const expected = options.export.replaceAll(/\{([^}]+)\}/g, (placeholder, key: string) => {
              const group = groups[key.toLowerCase()]

              if (!group) {
                return placeholder
              }

              if (/^[A-Z]/.test(key)) {
                return namingPascalCase(group)
              }

              return options.camelCase ? namingCamelCase(group) : group
            })

            const functions = (scope === 'exports' ? exportsFunctions(program) : declarationsFunctions(program)).filter(
              ({ name }) => !optionsPatternsTest(allowed, name),
            )

            if (options.match === 'some') {
              if (functions.some((item) => item.name === expected)) {
                continue
              }

              const first = functions.at(0)
              context.report({
                node: first?.node ?? program,
                messageId: 'mismatch',
                data: { actual: first?.name ?? '<none>', expected, file },
              })

              continue
            }

            for (const item of functions) {
              if (item.name !== expected) {
                context.report({
                  node: item.node,
                  messageId: 'mismatch',
                  data: { actual: item.name, expected, file },
                })
              }
            }

            continue
          }

          const names: Pick<DeclarationsNamed, 'name' | 'node'>[] = scope === 'declarations'
            ? [...(declarations ??= declarationsNamed(program))]
            : (bindings ??= exportsCollect(program)).flatMap((binding) =>
              options.types && binding.typeOnly ? [] : [{ name: binding.localName ?? binding.exportedName, node: binding.node }],
            )

          if (scope === 'functions') {
            const exported = new Set(names.map((item) => item.name))
            names.push(
              ...(declarations ??= declarationsNamed(program)).filter(
                ({ name, node }) =>
                  !exported.has(name) &&
                  (node.type === 'FunctionDeclaration' || (node.type === 'VariableDeclarator' && declarationsIsFunctionValue(node.init))),
              ),
            )
          }

          if (options.services) {
            names.push(...declarationsPublicServiceMethods(program))
          }

          const prefixes = options.mode === 'pattern' ? [] : namingFilePrefixesFor(context.filename, options)
          const expected = options.mode === 'pattern' ? optionsPatternsWithEmpty(options.pattern, options.flags) : []

          for (const item of declarationsUnique(names)) {
            if (optionsPatternsTest(allowed, item.name)) {
              continue
            }

            if (options.mode === 'pattern') {
              if (!optionsPatternsTest(expected, item.name)) {
                context.report({
                  node: item.node,
                  messageId: 'pattern',
                  data: { name: item.name, pattern: optionsPatternLabel(options.pattern) },
                })
              }

              continue
            }

            if (!namingHasFilePrefix(item.name, prefixes, options.normalize)) {
              context.report({
                node: item.node,
                messageId: 'prefix',
                data: { name: item.name, prefix: prefixes.join(' or ') },
              })
            }
          }
        }
      },
    }
  },
})
