import { defineRule } from '@oxlint/plugins'
import { declarationsFunctions } from '../../utils/declarations.utils.ts'
import { exportsCollect, exportsFunctions } from '../../utils/exports.utils.ts'
import { namingBasename, namingCamelCase, namingFileStem, namingPascalCase, namingStemModes } from '../../utils/naming.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { FilesExportsOptions } from '../../types/files.types.ts'

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const filesExports = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          names: { type: 'array', items: { type: 'string' } },
          patterns: { type: 'array', items: { type: 'string' } },
          stem: { type: 'string', enum: [...namingStemModes] },
          roles: { type: 'array', items: { type: 'string' } },
          separators: { type: 'array', items: { type: 'string' } },
          types: { type: 'boolean' },
          factory: { type: 'string' },
          scope: { type: 'string', enum: ['exports', 'declarations'] },
        },
        anyOf: [{ required: ['names'] }, { required: ['patterns'] }, { required: ['factory'] }],
      },
    ],
    messages: {
      extraExport: "Export '{{name}}' is not allowed; expected one of: {{allowed}}.",
      factory: "Function '{{actual}}' must be named '{{expected}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const options = optionsFirst<FilesExportsOptions>(context, {})
        const basename = namingBasename(context.filename).replace(/\.(tsx?|jsx?)$/, '')

        if (options.factory !== undefined) {
          const expected = options.factory.replaceAll('{Stem}', namingPascalCase(basename)).replaceAll('{stem}', basename)
          const functions = options.scope === 'declarations' ? declarationsFunctions(program) : exportsFunctions(program)

          if (functions.length === 0) {
            context.report({
              node: program,
              messageId: 'factory',
              data: { actual: '<none>', expected },
            })
          }

          for (const item of functions) {
            if (item.name !== expected) {
              context.report({
                node: item.node,
                messageId: 'factory',
                data: { actual: item.name, expected },
              })
            }
          }
        }

        if (options.names === undefined && options.patterns === undefined) {
          return
        }

        const domain = namingFileStem(basename, options.stem, options.roles, options.separators)
        const pascalDomain = namingPascalCase(domain)
        const camelDomain = namingCamelCase(domain)
        const allowed = (options.names ?? []).map((template) => template.replaceAll('{Domain}', pascalDomain).replaceAll('{domain}', camelDomain))

        const patterns = (options.patterns ?? []).map((template) => {
          const source = template
            .replaceAll('{Domain}', escapeRegExp(pascalDomain))
            .replaceAll('{domain}', escapeRegExp(camelDomain))

          return new RegExp(`^(?:${source})$`)
        })

        const allowedLabel = [...allowed, ...patterns.map((pattern) => pattern.toString())].join(', ')

        for (const binding of exportsCollect(program)) {
          if (options.types && binding.typeOnly) {
            continue
          }

          const name = binding.localName ?? binding.exportedName

          if (!allowed.includes(name) && !patterns.some((pattern) => pattern.test(name))) {
            context.report({
              node: binding.node,
              messageId: 'extraExport',
              data: { name, allowed: allowedLabel },
            })
          }
        }
      },
    }
  },
})
