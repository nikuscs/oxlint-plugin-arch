import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { astDottedName, optionsFirst, optionsPatternLabel, optionsPatternSchema } from '../utils/index.ts'
import type { OptionsPattern } from '../utils/index.ts'

interface TestTitlePatternOptions {
  callees: string[]
  forbid?: OptionsPattern
  require?: OptionsPattern
  flags: string
}

const TEST_MODIFIERS = new Set(['only', 'skip', 'concurrent', 'todo', 'each'])

function isConfiguredName(name: string | undefined, callees: readonly string[]): boolean {
  if (!name) {
    return false
  }

  return callees.some((callee) => {
    if (name === callee) {
      return true
    }

    if (!name.startsWith(`${callee}.`)) {
      return false
    }

    return name
      .slice(callee.length + 1)
      .split('.')
      .every((part) => TEST_MODIFIERS.has(part))
  })
}

function isConfiguredCall(node: ESTree.CallExpression, callees: readonly string[]): boolean {
  if (isConfiguredName(astDottedName(node.callee), callees)) {
    return true
  }

  if (node.callee.type === 'CallExpression') {
    return isConfiguredName(astDottedName(node.callee.callee), callees)
  }

  return node.callee.type === 'TaggedTemplateExpression' && isConfiguredName(astDottedName(node.callee.tag), callees)
}

function titleText(node: ESTree.Expression | ESTree.SpreadElement): string | undefined {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? node.quasis[0]?.value.raw
  }
}

interface TitlePattern {
  regex: RegExp
  pattern: string
}

function regexMatches(regex: RegExp, value: string): boolean {
  regex.lastIndex = 0
  return regex.test(value)
}

// Why: messages name the pattern that matched, so each source stays next to its regex.
function titlePatterns(pattern: OptionsPattern | undefined, flags: string): TitlePattern[] {
  return pattern === undefined
    ? []
    : [pattern].flat().map((source) => ({ regex: new RegExp(source, flags), pattern: source }))
}

/**
 * Enforces configurable forbidden and required patterns on static test titles. Each option takes one regex or a list:
 * a title fails when it matches any `forbid` pattern, or matches none of the `require` patterns.
 *
 * Example: with `forbid: '^should '`, `test('should save', fn)` fails.
 */
export const testTitlePattern = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          callees: { type: 'array', items: { type: 'string' } },
          forbid: optionsPatternSchema,
          require: optionsPatternSchema,
          flags: { type: 'string', pattern: '^[dgimsuvy]*$' },
        },
      },
    ],
    defaultOptions: [
      {
        callees: ['describe', 'it', 'test'],
        flags: '',
      },
    ],
    messages: {
      forbidden: "Test title matches forbidden pattern '{{pattern}}'.",
      required: "Test title must match required pattern '{{pattern}}'.",
    },
  },
  createOnce(context) {
    let callees: string[] = []
    let forbid: TitlePattern[] = []
    let required: TitlePattern[] = []
    let requiredLabel = ''

    return {
      before() {
        const options = optionsFirst<TestTitlePatternOptions>(context)
        callees = options.callees
        const flags = options.flags ?? ''
        forbid = titlePatterns(options.forbid, flags)
        required = titlePatterns(options.require, flags)
        requiredLabel = optionsPatternLabel(options.require)

        if (forbid.length === 0 && required.length === 0) {
          return false
        }
      },
      CallExpression(node) {
        if (!isConfiguredCall(node, callees)) {
          return
        }

        const title = node.arguments[0]
        if (!title) {
          return
        }

        const text = titleText(title)
        if (text === undefined) {
          return
        }

        const forbidden = forbid.find((item) => regexMatches(item.regex, text))
        if (forbidden) {
          context.report({
            node: title,
            messageId: 'forbidden',
            data: { pattern: forbidden.pattern },
          })
        }

        if (required.length > 0 && !required.some((item) => regexMatches(item.regex, text))) {
          context.report({
            node: title,
            messageId: 'required',
            data: { pattern: requiredLabel },
          })
        }
      },
    }
  },
})
