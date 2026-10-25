import { defineRule } from '@oxlint/plugins'
import { namingBasename, namingFolderPrefixes, namingFolders, namingFoldersAfter } from '../../utils/naming.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { NamingFolderOptions } from '../../types/naming.types.ts'

export const namingFolder = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          singularize: { type: 'string', enum: ['none', 'trailing-s'] },
          separators: { type: 'array', items: { type: 'string' } },
          after: { type: 'string' },
          stripPrefixes: { type: 'array', items: { type: 'string', minLength: 1 } },
        },
      },
    ],
    messages: {
      prefix: "File '{{file}}' must start with '{{expected}}' to match its domain folder '{{folder}}'.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const { singularize = 'trailing-s', separators = ['-'], after, stripPrefixes = [] } = optionsFirst<NamingFolderOptions>(context, {})
        const parent = [namingFolders(context.filename).at(-1) ?? '']
        const folders = after ? namingFoldersAfter(context.filename, after) : parent

        if (!folders) {
          return
        }

        const resolved = folders.length > 0 ? folders : parent
        const prefixes = namingFolderPrefixes(resolved, separators[0] ?? '-', singularize)
        const file = namingBasename(context.filename)
        const rawStem = file.replace(/\.(tsx?|jsx?)$/, '')
        const strip = stripPrefixes.find((prefix) => rawStem.startsWith(prefix))
        const stem = strip ? rawStem.slice(strip.length) : rawStem

        if (prefixes.some((prefix) => stem === prefix || separators.some((separator) => stem.startsWith(`${prefix}${separator}`)))) {
          return
        }
        context.report({
          node: program,
          messageId: 'prefix',
          data: {
            file,
            folder: resolved.join('/'),
            expected: prefixes.map((prefix) => `${stripPrefixes[0] ?? ''}${prefix}`).join(' or '),
          },
        })
      },
    }
  },
})
