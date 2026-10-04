import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { optionsFirst, optionsOptionalPatterns, optionsPatternSchema, optionsPatternsTest } from '../utils/index.ts'
import type { OptionsPattern } from '../utils/index.ts'

interface NoTypeDeclarationsOptions {
  allowPattern?: OptionsPattern
}

/**
 * Rejects type aliases and interfaces in matched files. `allowPattern` exempts a declaration when any
 * pattern matches its name; a pattern starting with `=` or `^=` matches a type alias's `= value` text instead.
 *
 * Example: `interface User {}` fails in an API module; `type AccessRequestErrorKind = 'x'` can pass with
 * `allowPattern: 'ErrorKind$'`, and `type Retry = ReturnType<typeof makeRetry>` with `'^= ReturnType<typeof '`.
 */
export const noTypeDeclarations = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowPattern: optionsPatternSchema,
        },
      },
    ],
    messages: {
      typeDeclaration: "Type '{{name}}' must not be declared in this file.",
    },
  },
  createOnce(context) {
    let allowedNames: RegExp[] = []
    let allowedValues: RegExp[] = []

    function check(node: ESTree.TSTypeAliasDeclaration | ESTree.TSInterfaceDeclaration) {
      if (optionsPatternsTest(allowedNames, node.id.name)) return
      if (
        node.type === 'TSTypeAliasDeclaration' &&
        allowedValues.length > 0 &&
        optionsPatternsTest(allowedValues, `= ${context.sourceCode.getText(node.typeAnnotation)}`)
      )
        return

      context.report({
        node,
        messageId: 'typeDeclaration',
        data: { name: node.id.name },
      })
    }

    return {
      before() {
        const { allowPattern } = optionsFirst<NoTypeDeclarationsOptions>(context, {})
        const sources = allowPattern === undefined ? [] : [allowPattern].flat()
        const isValuePattern = (source: string) => /^\^?=/.test(source)
        allowedNames = optionsOptionalPatterns(sources.filter((source) => !isValuePattern(source)))
        allowedValues = optionsOptionalPatterns(sources.filter(isValuePattern))
      },
      TSTypeAliasDeclaration: check,
      TSInterfaceDeclaration: check,
    }
  },
})
