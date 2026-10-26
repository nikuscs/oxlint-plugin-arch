import { defineRule } from '@oxlint/plugins'
import { exportsCollect } from '../../utils/exports.utils.ts'
import { namingBasename } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import { reactIsComponent } from '../../utils/react.utils.ts'
import type { DeclarationsCandidate } from '../../types/declarations.types.ts'
import type { FilesComponentsOnlyOptions } from '../../types/files.types.ts'

function componentName(basename: string): string {
  return basename.replace(/\.(tsx?|jsx?)$/, '').replaceAll(/(?:^[-.]*|[-.]+)(.?)/g, (_, char: string) => char.toUpperCase())
}

export const filesComponentsOnly = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          filename: { type: 'boolean' },
          roles: { type: 'array', items: { type: 'string' } },
          types: { type: 'boolean' },
          deny: optionsPatternSchema,
        },
      },
    ],
    messages: {
      nonComponent: "Export '{{name}}' must be a React component or type.",
      nameMismatch: "Component export '{{name}}' must match '{{expected}}' or its prefix.",
      typeExport: "Type export '{{name}}' is not allowed.",
      deniedType: "Type export '{{name}}' is denied by the deny option.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          filename: matchFileName = true,
          roles: trailingRoles = [],
          types: allowTypeExports = true,
          deny: denyTypePattern,
        } = optionsFirst<FilesComponentsOnlyOptions>(context, {})

        const basename = namingBasename(context.filename)
        const extension = basename.slice(basename.lastIndexOf('.'))
        const role = trailingRoles.find((candidate) => basename.endsWith(`.${candidate}${extension}`))
        const expected = componentName(role ? basename.replace(`.${role}${extension}`, extension) : basename)
        const expectedKeys = [expected, ...(role ? [componentName(basename)] : [])].map((name) => name.toLowerCase())
        const denied = optionsPatterns(denyTypePattern)
        const components: DeclarationsCandidate[] = []

        for (const binding of exportsCollect(program)) {
          const candidate: DeclarationsCandidate = { ...binding, name: binding.localName ?? binding.exportedName }
          const { name, node } = candidate

          if (candidate.typeOnly) {
            if (!allowTypeExports) {
              context.report({
                node,
                messageId: 'typeExport',
                data: { name },
              })
            } else if (optionsPatternsTest(denied, name)) {
              context.report({
                node,
                messageId: 'deniedType',
                data: { name },
              })
            }
          } else if (reactIsComponent(program, candidate)) {
            components.push(candidate)
          } else {
            context.report({
              node,
              messageId: 'nonComponent',
              data: { name },
            })
          }
        }

        if (components.length === 0 || !matchFileName) {
          return
        }

        const names = components.map((candidate) => candidate.name.toLowerCase())

        if (expectedKeys.some((key) => names.includes(key) || names.every((name) => name.startsWith(key)))) {
          return
        }

        for (const { name, node } of components) {
          context.report({
            node,
            messageId: 'nameMismatch',
            data: { name, expected },
          })
        }
      },
    }
  },
})
