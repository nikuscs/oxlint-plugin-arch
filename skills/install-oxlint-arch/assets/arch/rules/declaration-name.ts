import { defineRule } from '@oxlint/plugins'
import {
  declarationsCollectNamed,
  declarationsKinds,
  namingFileBasename,
  namingFilePrefixes,
  namingFileStem,
  namingStemModes,
  optionsFirst,
  type DeclarationsKind,
} from '../utils/index.ts'

interface DeclarationNameOptions {
  kinds?: DeclarationsKind[]
  pattern?: string
  flags?: string
  stem?: 'before-first-dot' | 'full-basename'
  trailingRoles?: string[]
  roleSeparators?: string[]
  normalize?: 'remove-separators' | 'none'
  singularize?: 'none' | 'trailing-s'
  allowPattern?: string
}

/**
 * Checks selected declarations in a file against a filename-derived prefix or a consumer pattern.
 *
 * Example: On `agent-setups.types.ts`, `kinds: ['type']` and `singularize: 'trailing-s'` accepts `AgentSetupTimeTrigger` and rejects `DraftStatus`.
 * Example: With `trailingRoles: ['utils']`, `onchain-utils.ts` accepts `OnchainClient` the same way `onchain.utils.ts` does.
 */
export const declarationName = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        kinds: {
          type: 'array',
          items: { type: 'string', enum: [...declarationsKinds] },
        },
        pattern: { type: 'string' },
        flags: { type: 'string' },
        stem: { type: 'string', enum: [...namingStemModes] },
        trailingRoles: { type: 'array', items: { type: 'string' } },
        roleSeparators: { type: 'array', items: { type: 'string' } },
        normalize: { type: 'string', enum: ['remove-separators', 'none'] },
        singularize: { type: 'string', enum: ['none', 'trailing-s'] },
        allowPattern: { type: 'string' },
      },
    }],
    messages: {
      prefix: "'{{name}}' must start with file prefix '{{prefix}}'.",
      pattern: "'{{name}}' must match {{pattern}}.",
    },
  },
  createOnce(context) {
    return {
      Program(program) {
        const options = optionsFirst<DeclarationNameOptions>(context, {
          stem: 'before-first-dot',
          normalize: 'remove-separators',
        })
        const allowed = options.allowPattern ? new RegExp(options.allowPattern) : null
        const expected = options.pattern ? new RegExp(options.pattern, options.flags) : null
        const basename = namingFileBasename(context.filename).replace(/\.(tsx?|jsx?)$/, '')
        const stem = namingFileStem(basename, options.stem, options.trailingRoles, options.roleSeparators)
        const prefixes = namingFilePrefixes(stem, options.normalize ?? 'remove-separators', options.singularize ?? 'none')
        const seen = new Set<string>()

        for (const item of declarationsCollectNamed(program, options.kinds)) {
          const key = `${item.name}:${item.node.start}:${item.node.end}`
          const comparableName = options.normalize === 'none' ? item.name : item.name.replaceAll('_', '').toLowerCase()
          const matches = expected
            ? expected.test(item.name)
            : prefixes.some((prefix) => comparableName.startsWith(prefix))

          if (seen.has(key) || allowed?.test(item.name) || matches) {
            continue
          }

          seen.add(key)
          context.report({
            node: item.node,
            messageId: expected ? 'pattern' : 'prefix',
            data: expected
              ? { name: item.name, pattern: options.pattern ?? '' }
              : { name: item.name, prefix: prefixes.join(' or ') },
          })
        }
      },
    }
  },
})
