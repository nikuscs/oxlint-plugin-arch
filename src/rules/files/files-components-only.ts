import { defineRule } from '@oxlint/plugins'
import { namingBasename, namingComponentName } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsPatterns, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import { reactExportCandidates, reactIsComponent } from '../../utils/react.utils.ts'
import type { DeclarationsCandidate } from '../../types/declarations.types.ts'
import type { FilesComponentsOnlyOptions } from '../../types/files.types.ts'

export const filesComponentsOnly = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          matchFileName: { type: 'boolean' },
          trailingRoles: { type: 'array', items: { type: 'string' } },
          allowTypeExports: { type: 'boolean' },
          denyTypePattern: optionsPatternSchema,
        },
      },
    ],
    messages: {
      nonComponent: "Export '{{name}}' must be a React component or type.",
      nameMismatch: "Component export '{{name}}' must match '{{expected}}' or its prefix.",
      typeExport: "Type export '{{name}}' is not allowed.",
      deniedType: "Type export '{{name}}' is denied by denyTypePattern.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          matchFileName = true,
          trailingRoles = [],
          allowTypeExports = true,
          denyTypePattern,
        } = optionsFirst<FilesComponentsOnlyOptions>(context, {})

        const basename = namingBasename(context.filename)
        const extension = basename.slice(basename.lastIndexOf('.'))
        const role = trailingRoles.find((candidate) => basename.endsWith(`.${candidate}${extension}`))
        const expected = namingComponentName(role ? basename.replace(`.${role}${extension}`, extension) : basename)
        const expectedKeys = [expected, ...(role ? [namingComponentName(basename)] : [])].map((name) => name.toLowerCase())
        const denied = optionsPatterns(denyTypePattern)
        const components: DeclarationsCandidate[] = []

        for (const candidate of reactExportCandidates(program)) {
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
