import { defineRule } from '@oxlint/plugins'
import { astDottedName, astMatchesCallee, astStaticString } from '../../utils/ast.utils.ts'
import {
  optionsFirst,
  optionsPatternLabel,
  optionsPatternSchema,
  optionsPatternsTest,
  optionsPatternsWithEmpty,
} from '../../utils/options.utils.ts'
import type { TestsTitlesOptions, TestsTitlesPattern } from '../../types/tests.types.ts'

const testsTitlesModifiers = new Set(['only', 'skip', 'concurrent', 'sequential', 'todo', 'each', 'for'])

export const testsTitles = defineRule({
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          callees: { type: 'array', items: { type: 'string' } },
          deny: optionsPatternSchema,
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
    let required: RegExp[] = []
    let requiredLabel = ''

    return {
      before() {
        const options = optionsFirst<TestsTitlesOptions>(context)
        const flags = options.flags ?? ''
        callees = options.callees
        forbid = options.deny === undefined ? [] : [options.deny].flat().map((source) => ({ regex: new RegExp(source, flags), pattern: source }))
        required = optionsPatternsWithEmpty(options.require, flags)
        requiredLabel = optionsPatternLabel(options.require)
        if (forbid.length === 0 && required.length === 0) {
          return false
        }
      },
      CallExpression(node) {
        const title = node.arguments.at(0)

        const callee = node.callee

        const configured =
          astMatchesCallee(astDottedName(callee), callees, testsTitlesModifiers) ||
          (callee.type === 'CallExpression' && astMatchesCallee(astDottedName(callee.callee), callees, testsTitlesModifiers)) ||
          (callee.type === 'TaggedTemplateExpression' && astMatchesCallee(astDottedName(callee.tag), callees, testsTitlesModifiers))

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

        if (required.length > 0 && !optionsPatternsTest(required, text)) {
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
