import { test } from 'vitest'
import { jsxAttributesMultiline } from '../rules/jsx-attributes-multiline.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'multiline' }
const selfClosingOutput = 'const view = <Panel\n  first={1}\n  second={2}\n  {...rest}\n/>'
const openingOutput = 'const view = <Panel\n  first={1}\n  second={2}\n  third={3}\n>content</Panel>'

test('jsx-attributes-multiline', () => {
  createRuleTester('tsx').run('arch/jsx-attributes-multiline', jsxAttributesMultiline, {
    valid: [
      'const view = <Panel first={1} second={2} />',
      selfClosingOutput,
      openingOutput,
      {
        code: 'const view = <Panel first={1} second={2} third={3} />',
        options: [{ minAttributes: 4 }],
      },
      {
        code: 'const view = <Panel\n\tfirst={1}\n\tsecond={2}\n\tthird={3}\n/>',
        options: [{ indent: 'tab' }],
      },
    ],
    invalid: [
      {
        code: 'const view = <Panel first={1} second={2} {...rest} />',
        output: selfClosingOutput,
        errors: [error],
      },
      {
        code: 'const view = <Panel first={1} second={2} third={3}>content</Panel>',
        output: openingOutput,
        errors: [error],
      },
      {
        code: 'function View() {\n  return <Panel first={1} second={2} third={3} />\n}',
        output: 'function View() {\n  return <Panel\n    first={1}\n    second={2}\n    third={3}\n  />\n}',
        errors: [error],
      },
      {
        code: 'const view = <Panel first={1 /* keep */} second={2} third={3} />',
        output: null,
        errors: [error],
      },
      {
        code: 'const view = <Panel first={1} second={2} third={3} />',
        output: 'const view = <Panel\n\tfirst={1}\n\tsecond={2}\n\tthird={3}\n/>',
        options: [{ indent: 'tab' }],
        errors: [error],
      },
    ],
  })
})
