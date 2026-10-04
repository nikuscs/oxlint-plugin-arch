import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import {
  type DeclarationsKind,
  declarationsKinds,
  declarationsNamedFromNode,
  namingFileBasename,
  namingFilePrefixes,
  namingFileStem,
  namingStemModes,
  optionsFirst,
  optionsOptionalPatterns,
  type OptionsPattern,
  optionsPatternLabel,
  optionsPatternSchema,
  optionsPatternsTest,
} from '../utils/index.ts'

interface DeclarationNameOptions {
  kinds?: DeclarationsKind[]
  pattern?: OptionsPattern
  flags?: string
  stem?: 'before-first-dot' | 'full-basename'
  trailingRoles?: string[]
  roleSeparators?: string[]
  normalize?: 'remove-separators' | 'none'
  singularize?: 'none' | 'trailing-s'
  allowPattern?: OptionsPattern
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
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          kinds: {
            type: 'array',
            items: { type: 'string', enum: [...declarationsKinds] },
          },
          pattern: optionsPatternSchema,
          flags: { type: 'string' },
          stem: { type: 'string', enum: [...namingStemModes] },
          trailingRoles: { type: 'array', items: { type: 'string' } },
          roleSeparators: { type: 'array', items: { type: 'string' } },
          normalize: { type: 'string', enum: ['remove-separators', 'none'] },
          singularize: { type: 'string', enum: ['none', 'trailing-s'] },
          allowPattern: optionsPatternSchema,
        },
      },
    ],
    messages: {
      prefix: "'{{name}}' must start with file prefix '{{prefix}}'.",
      pattern: "'{{name}}' must match {{pattern}}.",
    },
  },
  createOnce(context) {
    let options: DeclarationNameOptions = {}
    let kinds: Set<DeclarationsKind> | null = null
    let allowed: RegExp[] = []
    let expected: RegExp[] = []
    let prefixes: string[] = []

    function check(node: ESTree.Node) {
      const item = declarationsNamedFromNode(node)
      if (!item || (kinds && !kinds.has(item.kind)) || optionsPatternsTest(allowed, item.name)) {
        return
      }

      const comparableName = options.normalize === 'none' ? item.name : item.name.replaceAll('_', '').toLowerCase()
      const matches =
        expected.length > 0
          ? optionsPatternsTest(expected, item.name)
          : prefixes.some((prefix) => comparableName.startsWith(prefix))

      if (matches) {
        return
      }

      context.report({
        node: item.node,
        messageId: expected.length > 0 ? 'pattern' : 'prefix',
        data:
          expected.length > 0
            ? {
                name: item.name,
                pattern: optionsPatternLabel([options.pattern ?? []].flat().filter((source) => source !== '')),
              }
            : { name: item.name, prefix: prefixes.join(' or ') },
      })
    }

    return {
      before() {
        options = optionsFirst<DeclarationNameOptions>(context, {
          stem: 'before-first-dot',
          normalize: 'remove-separators',
        })
        kinds = options.kinds && options.kinds.length > 0 ? new Set(options.kinds) : null
        allowed = optionsOptionalPatterns(options.allowPattern)
        expected = optionsOptionalPatterns(options.pattern, options.flags)
        const basename = namingFileBasename(context.filename).replace(/\.(tsx?|jsx?)$/, '')
        const stem = namingFileStem(basename, options.stem, options.trailingRoles, options.roleSeparators)
        prefixes = namingFilePrefixes(stem, options.normalize ?? 'remove-separators', options.singularize ?? 'none')
      },
      FunctionDeclaration: check,
      ClassDeclaration: check,
      TSTypeAliasDeclaration: check,
      TSInterfaceDeclaration: check,
      TSEnumDeclaration: check,
      VariableDeclarator: check,
    }
  },
})
