import { defineRule } from '@oxlint/plugins'
import {
  declarationsFunctions,
  declarationsIsFunctionValue,
  declarationsNamed,
  declarationsPublicServiceMethods,
  declarationsUnique,
} from '../../utils/declarations.utils.ts'
import { exportsCollect, exportsFunctions } from '../../utils/exports.utils.ts'
import { namingBasename, namingCaptures, namingExpand, namingFilePrefixesFor, namingHasFilePrefix, namingStemSchemaProperties } from '../../utils/naming.utils.ts'
import {
  optionsAll,
  optionsEscape,
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
              export: optionsPatternSchema,
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
            const captures = namingCaptures(context.filename, { file: options.file, placeholder: options.placeholder })

            if (!captures) {
              continue
            }

            const names = [options.export].flat().map((template) => namingExpand(template, captures, options.camelCase ?? false))
            const expected = names.join(' or ')

            const functions = (scope === 'exports' ? exportsFunctions(program, true) : declarationsFunctions(program)).filter(
              ({ name }) => !optionsPatternsTest(allowed, name),
            )

            if (options.match === 'some') {
              if (functions.some((item) => names.includes(item.name))) {
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
              if (!names.includes(item.name)) {
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
            : (bindings ??= exportsCollect(program)).flatMap((binding) => {
              const name = binding.default ? (binding.localName ?? binding.exportedName) : binding.exportedName
              return options.types && binding.typeOnly ? [] : [{ name, node: binding.node }]
            })

          if (scope === 'functions') {
            const exported = new Set([...names.map((item) => item.name), ...(bindings ?? []).flatMap((binding) => binding.localName ?? [])])
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
          const captures = namingCaptures(context.filename) ?? {}
          const sources = options.mode === 'pattern' ? [options.pattern].flat().map((source) => namingExpand(source, captures, true, optionsEscape)) : []
          const expected = optionsPatternsWithEmpty(sources, options.mode === 'pattern' ? options.flags : undefined)

          for (const item of declarationsUnique(names)) {
            if (optionsPatternsTest(allowed, item.name)) {
              continue
            }

            if (options.mode === 'pattern') {
              if (!optionsPatternsTest(expected, item.name)) {
                context.report({
                  node: item.node,
                  messageId: 'pattern',
                  data: { name: item.name, pattern: optionsPatternLabel(sources) },
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
