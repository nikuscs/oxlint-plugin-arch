import { defineRule } from '@oxlint/plugins'
import { namingFileBasename, namingPosixPath, optionsFirst } from '../utils/index.ts'

interface FolderPrefixOptions {
  singularize?: 'none' | 'trailing-s'
  separators?: string[]
}

/**
 * Checks that a filename equals or starts with its parent folder name, including an optional singular form.
 *
 * Example: Inside `users/`, `user-card.tsx` passes while `profile.tsx` fails.
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
      },
    }],
    messages: {
      prefix: "File '{{file}}' must start with folder name '{{folder}}' or an allowed singular form.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const {
          singularize = 'trailing-s',
          separators = ['-'],
        } = optionsFirst<FolderPrefixOptions>(context, {})
        const normalized = namingPosixPath(context.filename)
        const folder = normalized.split('/').at(-2) ?? ''
        const prefixes = [folder]

        if (singularize === 'trailing-s' && folder.endsWith('s')) {
          prefixes.push(folder.slice(0, -1))
        }

        const file = namingFileBasename(normalized)
        const stem = file.replace(/\.(tsx?|jsx?)$/, '')
        const valid = prefixes.some((prefix) => stem === prefix
          || separators.some((separator) => stem.startsWith(`${prefix}${separator}`)))

        if (!valid) {
          context.report({
            node: program,
            messageId: 'prefix',
            data: { file, folder },
          })
        }
      },
    }
  },
})
