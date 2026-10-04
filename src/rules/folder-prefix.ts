import { defineRule } from '@oxlint/plugins'
import {
  namingDirSegments,
  namingFileBasename,
  namingFolderPrefixes,
  namingPosixPath,
  namingSegmentsAfter,
  optionsFirst,
} from '../utils/index.ts'

interface FolderPrefixOptions {
  singularize?: 'none' | 'trailing-s'
  separators?: string[]
  stripPrefixes?: string[]
  after?: string
}

/**
 * Checks that a filename equals or starts with its parent folder name, or with the folders after a configured root.
 *
 * Example: Inside `users/`, `user-card.tsx` passes. With `after: 'components'`, `components/admin/insights/admin-insights-foo.tsx` passes.
 */
export const folderPrefix = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        singularize: { type: 'string', enum: ['none', 'trailing-s'] },
        separators: { type: 'array', items: { type: 'string' } },
        after: { type: 'string' },
        stripPrefixes: { type: 'array', items: { type: 'string', minLength: 1 } },
      },
    }],
    messages: {
      prefix: "File '{{file}}' must start with '{{expected}}' to match its domain folder '{{folder}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          singularize = 'trailing-s',
          separators = ['-'],
          after,
          stripPrefixes = [],
        } = optionsFirst<FolderPrefixOptions>(context, {})
        const filename = namingPosixPath(context.filename)
        const folders = after
          ? namingSegmentsAfter(filename, after)
          : [namingDirSegments(filename).at(-1) ?? '']

        if (!folders) {
          return
        }

        const resolved = folders.length > 0 ? folders : [namingDirSegments(filename).at(-1) ?? '']
        const separator = separators[0] ?? '-'
        const prefixes = namingFolderPrefixes(resolved, separator, singularize)
        const file = namingFileBasename(filename)
        const rawStem = file.replace(/\.(tsx?|jsx?)$/, '')
        const strip = stripPrefixes.find((prefix) => rawStem.startsWith(prefix))
        const stem = strip ? rawStem.slice(strip.length) : rawStem
        const valid = prefixes.some((prefix) => stem === prefix
          || separators.some((item) => stem.startsWith(`${prefix}${item}`)))

        if (!valid) {
          context.report({
            node: program,
            messageId: 'prefix',
            data: { file, folder: resolved.join('/'), expected: prefixes.map((prefix) => `${stripPrefixes[0] ?? ''}${prefix}`).join(' or ') },
          })
        }
      },
    }
  },
})
