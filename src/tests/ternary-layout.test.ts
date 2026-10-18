import { test } from 'vitest'
import { ternaryLayout } from '../rules/ternary-layout.ts'
import { createRuleTester } from './rule-tester.ts'

test('ternary-layout', () => {
  createRuleTester().run('arch/ternary-layout', ternaryLayout, {
    valid: [
      'const result = ready ? yes : no',
      {
        code: 'const result = ready\n  ? yes\n  : no',
        options: [{ maxLength: 20 }],
      },
      'const result = a ? b ? c : d : e',
      'const result = a /* keep */\n ? b\n : c',
      'const result = a ? {\n b: 1\n} : c',
      {
        code: 'const result = `prefix ${ready ? yes : no}`',
        options: [{ maxLength: 10 }],
      },
      {
        code: 'x = a ? b : c',
        options: [{ maxLength: 13 }],
      },
    ],
    invalid: [
      {
        code: "function run() {\n  if (ready) {\n    callTool.mockResolvedValueOnce(body instanceof Error ? { isError: true, content: [{ type: 'text', text: body.message }] } : { content: [{ type: 'text', text: JSON.stringify(body) }] });\n  }\n}",
        output: "function run() {\n  if (ready) {\n    callTool.mockResolvedValueOnce(body instanceof Error\n      ? { isError: true, content: [{ type: 'text', text: body.message }] }\n      : { content: [{ type: 'text', text: JSON.stringify(body) }] });\n  }\n}",
        errors: [{ messageId: 'split' }],
      },
      {
        code: 'const result = ready\n  ? yes\n  : no',
        output: 'const result = ready ? yes : no',
        errors: [{ messageId: 'join' }],
      },
      {
        code: 'const result = ready ? yes : no',
        output: 'const result = ready\n  ? yes\n  : no',
        errors: [{ messageId: 'split' }],
        options: [{ maxLength: 20 }],
      },
      {
        code: '  const result = ready ? yes : no',
        output: '  const result = ready\n      ? yes\n      : no',
        errors: [{ messageId: 'split' }],
        options: [{ maxLength: 20, indent: 4 }],
      },
      {
        code: 'const result = `prefix ${ready\n  ? yes\n  : no}`',
        output: 'const result = `prefix ${ready ? yes : no}`',
        errors: [{ messageId: 'join' }],
        options: [{ maxLength: 10 }],
      },
      {
        code: 'const result = (ready) ? (yes) : (no)',
        output: 'const result = (ready)\n  ? (yes)\n  : (no)',
        errors: [{ messageId: 'split' }],
        options: [{ maxLength: 20 }],
      },
      {
        code: 'const result = ready ? yes : no\r\n',
        output: 'const result = ready\r\n  ? yes\r\n  : no\r\n',
        errors: [{ messageId: 'split' }],
        options: [{ maxLength: 20 }],
      },
      {
        code: 'const result = ready\r\n  ? yes\r\n  : no',
        output: 'const result = ready ? yes : no',
        errors: [{ messageId: 'join' }],
      },
      {
        code: 'x = a ? b : c',
        output: 'x = a\n  ? b\n  : c',
        errors: [{ messageId: 'split' }],
        options: [{ maxLength: 12 }],
      },
      {
        code: 'const result = ready ? yes : no // a long suffix',
        output: 'const result = ready\n  ? yes\n  : no // a long suffix',
        errors: [{ messageId: 'split' }],
        options: [{ maxLength: 35 }],
      },
    ],
  })
})
