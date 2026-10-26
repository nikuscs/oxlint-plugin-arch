import { defineRule } from '@oxlint/plugins'
import { posix } from 'node:path'
import { namingBasename } from '../../utils/naming.utils.ts'
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
          prefixes: { type: 'array', items: { type: 'string', minLength: 1 } },
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
        const { singularize = 'trailing-s', separators = ['-'], after, prefixes: stripPrefixes = [] } = optionsFirst<NamingFolderOptions>(context, {})

        const all = posix
          .dirname(context.filename.replaceAll('\\', '/'))
          .split('/')
          .filter((part) => part && part !== '.')

        const parent = [all.at(-1) ?? '']
        let folders = after ? undefined : parent
        const marker = (after ?? '').split('/').filter(Boolean)

        for (let index = all.length - marker.length; marker.length > 0 && index >= 0 && !folders; index -= 1) {
          if (marker.every((part, offset) => all[index + offset] === part)) {
            folders = all.slice(index + marker.length)
          }
        }

        if (!folders) {
          return
        }

        const resolved = folders.length > 0 ? folders : parent
        const last = resolved.at(-1) ?? ''
        const joiner = separators[0] ?? '-'
        const singular = singularize === 'trailing-s' && last.endsWith('s') && last.length > 1

        const prefixes = [
          resolved.join(joiner),
          ...(singular ? [[...resolved.slice(0, -1), last.slice(0, -1)].join(joiner)] : []),
        ].filter(Boolean)

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
