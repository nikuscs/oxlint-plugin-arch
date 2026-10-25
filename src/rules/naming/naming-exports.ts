import { defineRule } from '@oxlint/plugins'
import {
  declarationsFunctions,
  declarationsNamed,
  declarationsPublicServiceMethods,
  declarationsUnique,
} from '../../utils/declarations.utils.ts'
import { exportsCollect, exportsFunctions } from '../../utils/exports.utils.ts'
import {
  namingBasename,
  namingExpandTemplate,
  namingFilePrefixesFor,
  namingHasFilePrefix,
  namingMatchTemplate,
  namingStemSchemaProperties,
} from '../../utils/naming.utils.ts'
import { optionsPatternLabel, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { DeclarationsNamed } from '../../types/declarations.types.ts'
import type { NamingExportsOptions } from '../../types/naming.types.ts'
import type { OptionsSchemaProperties } from '../../types/options.types.ts'

const namingExportsScopeProperties: OptionsSchemaProperties = {
  scope: { type: 'string', enum: ['exports', 'functions', 'declarations'] },
  ignoreTypeExports: { type: 'boolean' },
  serviceMethods: { type: 'boolean' },
  allowPattern: optionsPatternSchema,
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
              placeholderPattern: { type: 'string' },
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
        // oxlint-disable-next-line dillon-anti-slop/require-safety-comment-for-type-assertion -- Oxlint validates options against meta.schema before create runs
        const checks = (context.options.length > 0 ? context.options : [{}]) as NamingExportsOptions[]

        for (const options of checks) {
          const scope = options.scope ?? 'exports'
          const allowed = optionsPatterns(options.allowPattern)

          if (options.mode === 'template') {
            const file = namingBasename(context.filename)
            const groups = namingMatchTemplate(file, options.file, options.placeholderPattern)

            if (!groups) {
              continue
            }

            const expected = namingExpandTemplate(options.export, groups, options.camelCase)

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
            ? declarationsNamed(program)
            : exportsCollect(program).flatMap((binding) =>
              options.ignoreTypeExports && binding.typeOnly ? [] : [{ name: binding.localName ?? binding.exportedName, node: binding.node }],
            )

          if (scope === 'functions') {
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

          const prefixes = options.mode === 'pattern' ? [] : namingFilePrefixesFor(context.filename, options)
          const expected = options.mode === 'pattern' ? optionsPatterns(options.pattern, options.flags) : []

          for (const item of declarationsUnique(names)) {
            if (optionsPatternsTest(allowed, item.name)) {
              continue
            }

            if (options.mode === 'pattern') {
              if (!optionsPatternsTest(expected, item.name)) {
                context.report({
                  node: item.node,
                  messageId: 'pattern',
                  data: { name: item.name, pattern: optionsPatternLabel([options.pattern].flat().filter((source) => source !== '')) },
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
