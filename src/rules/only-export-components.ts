import { defineRule } from '@oxlint/plugins'
import {
  namingFileBasename,
  optionsFirst,
  reactComponentsExportCandidates,
  reactComponentsIsLike,
  reactComponentsPascalFromBasename,
} from '../utils/index.ts'

interface OnlyExportComponentsOptions {
  matchFileName?: boolean
  allowTypeExports?: boolean
  denyTypePattern?: string
}

/**
 * Allows only React components and, by default, type exports, with optional matching between component names and filenames.
 *
 * Example: `button.tsx` exporting `Button` passes; exporting a plain `buttonConfig` value fails. Set `allowTypeExports: false` to reject types.
 */
export const onlyExportComponents = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        matchFileName: { type: 'boolean' },
        allowTypeExports: { type: 'boolean' },
        denyTypePattern: { type: 'string' },
      },
    }],
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
          allowTypeExports = true,
          denyTypePattern,
        } = optionsFirst<OnlyExportComponentsOptions>(context, {})
        const expected = reactComponentsPascalFromBasename(namingFileBasename(context.filename))
        const denied = denyTypePattern ? new RegExp(denyTypePattern) : null
        const components = []

        for (const candidate of reactComponentsExportCandidates(program)) {
          if (candidate.typeOnly) {
            if (!allowTypeExports) {
              context.report({
                node: candidate.node,
                messageId: 'typeExport',
                data: { name: candidate.name, expected },
              })
            } else if (denied?.test(candidate.name)) {
              context.report({
                node: candidate.node,
                messageId: 'deniedType',
                data: { name: candidate.name, expected },
              })
            }
            continue
          }

          if (!reactComponentsIsLike(program, candidate)) {
            context.report({
              node: candidate.node,
              messageId: 'nonComponent',
              data: { name: candidate.name, expected },
            })
            continue
          }

          components.push(candidate)
        }

        if (components.length === 0 || !matchFileName) {
          return
        }

        const expectedKey = expected.toLowerCase()
        const exact = components.some((candidate) => candidate.name.toLowerCase() === expectedKey)
        const allPrefixed = components.every((candidate) => candidate.name.toLowerCase().startsWith(expectedKey))

        if (!exact && !allPrefixed) {
          for (const candidate of components) {
            context.report({
              node: candidate.node,
              messageId: 'nameMismatch',
              data: { name: candidate.name, expected },
            })
          }
        }
      },
    }
  },
})
