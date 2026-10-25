import { defineRule } from '@oxlint/plugins'
import { astDottedName, astMatchesCallee, astStaticString } from '../../utils/ast.utils.ts'
import { optionsFirst, optionsPatternLabel, optionsPatternSchema, optionsPatternsTest } from '../../utils/options.utils.ts'
import type { OptionsPattern } from '../../types/options.types.ts'
import type { TestsTitlesOptions, TestsTitlesPattern } from '../../types/tests.types.ts'

const testModifiers = new Set(['only', 'skip', 'concurrent', 'sequential', 'todo', 'each', 'for'])

function titlePatterns(pattern: OptionsPattern | undefined, flags: string): TestsTitlesPattern[] {
  return pattern === undefined
    ? []
    : [pattern].flat().map((source) => ({ regex: new RegExp(source, flags), pattern: source }))
}

export const testsTitles = defineRule({
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
    let forbid: TestsTitlesPattern[] = []
    let required: TestsTitlesPattern[] = []
    let requiredLabel = ''

    return {
      before() {
        const options = optionsFirst<TestsTitlesOptions>(context)
        const flags = options.flags ?? ''
        callees = options.callees
        forbid = titlePatterns(options.forbid, flags)
        required = titlePatterns(options.require, flags)
        requiredLabel = optionsPatternLabel(options.require)
        if (forbid.length === 0 && required.length === 0) {
          return false
        }
      },
      CallExpression(node) {
        const title = node.arguments.at(0)

        const callee = node.callee

        const configured =
          astMatchesCallee(astDottedName(callee), callees, testModifiers) ||
          (callee.type === 'CallExpression' && astMatchesCallee(astDottedName(callee.callee), callees, testModifiers)) ||
          (callee.type === 'TaggedTemplateExpression' && astMatchesCallee(astDottedName(callee.tag), callees, testModifiers))

        if (!title || !configured) {
          return
        }

        const text = astStaticString(title)

        if (text === undefined) {
          return
        }

        const forbidden = forbid.find(({ regex }) => optionsPatternsTest([regex], text))

        if (forbidden) {
          context.report({
            node: title,
            messageId: 'forbidden',
            data: { pattern: forbidden.pattern },
          })
        }

        if (required.length > 0 && !optionsPatternsTest(required.map(({ regex }) => regex), text)) {
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
