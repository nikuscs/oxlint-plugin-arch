import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { astDottedName, optionsFirst } from '../utils/index.ts'

interface TestTitlePatternOptions {
  callees: string[]
  forbid?: string
  require?: string
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

    return name.slice(callee.length + 1).split('.').every((part) => TEST_MODIFIERS.has(part))
  })
}

function isConfiguredCall(node: ESTree.CallExpression, callees: readonly string[]): boolean {
  if (isConfiguredName(astDottedName(node.callee), callees)) {
    return true
  }

  if (node.callee.type === 'CallExpression') {
    return isConfiguredName(astDottedName(node.callee.callee), callees)
  }

  return node.callee.type === 'TaggedTemplateExpression'
    && isConfiguredName(astDottedName(node.callee.tag), callees)
}

function titleText(node: ESTree.Expression | ESTree.SpreadElement): string | undefined {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? node.quasis[0]?.value.raw
  }
}

function regexMatches(regex: RegExp, value: string): boolean {
  regex.lastIndex = 0
  return regex.test(value)
}

/**
 * Enforces configurable forbidden and required patterns on static test titles.
 *
 * Example: with `forbid: '^should '`, `test('should save', fn)` fails.
 */
export const testTitlePattern = defineRule({
  meta: {
    type: 'suggestion',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        callees: { type: 'array', items: { type: 'string' } },
        forbid: { type: 'string' },
        require: { type: 'string' },
        flags: { type: 'string', pattern: '^[dgimsuvy]*$' },
      },
    }],
    defaultOptions: [{
      callees: ['describe', 'it', 'test'],
      flags: '',
    }],
    messages: {
      forbidden: "Test title matches forbidden pattern '{{pattern}}'.",
      required: "Test title must match required pattern '{{pattern}}'.",
    },
  },
  createOnce(context) {
    let callees: string[] = []
    let forbid: { regex: RegExp, pattern: string } | undefined
    let required: { regex: RegExp, pattern: string } | undefined

    return {
      before() {
        const options = optionsFirst<TestTitlePatternOptions>(context)
        callees = options.callees
        const flags = options.flags ?? ''
        forbid = options.forbid === undefined ? undefined : { regex: new RegExp(options.forbid, flags), pattern: options.forbid }
        required = options.require === undefined ? undefined : { regex: new RegExp(options.require, flags), pattern: options.require }

        if (forbid === undefined && required === undefined) {
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

        if (forbid && regexMatches(forbid.regex, text)) {
          context.report({
            node: title,
            messageId: 'forbidden',
            data: { pattern: forbid.pattern },
          })
        }

        if (required && !regexMatches(required.regex, text)) {
          context.report({
            node: title,
            messageId: 'required',
            data: { pattern: required.pattern },
          })
        }
      },
    }
  },
})
