import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { layoutTernary } from './layout-ternary.ts'

describe('arch/layout-ternary', () => {
  it.each([
    { name: 'a short ternary on one line passes', code: "const label = active ? 'On' : 'Off'" },
    { name: 'a split ternary over max passes', code: 'const result = ready\n  ? yes\n  : no', options: { max: 20 } },
    { name: 'a line at exactly max passes', code: 'x = a ? b : c', options: { max: 13 } },
    { name: 'nested ternaries are skipped', code: 'const result = a ? b ? c : d : e' },
    { name: 'a comment skips the ternary', code: 'const result = a /* keep */\n  ? b\n  : c' },
    { name: 'a multiline operand skips the ternary', code: 'const result = a ? {\n  b: 1\n} : c' },
    {
      name: 'a ternary in a template literal never splits',
      code: `const label = \`\${active ? 'On' : 'Off'}\`
`,
      options: { max: 20 },
    },
    {
      name: 'a short ternary in a template passes',
      code: `const result = \`prefix \${ready ? yes : no}\`
`,
      options: { max: 10 },
    },
    {
      name: 'joins a template literal ternary over max',
      code: `const label = \`\${active
  ? 'On'
  : 'Off'}\`
`,
      options: { max: 20 },
      output: `const label = \`\${active ? 'On' : 'Off'}\`
`,
      errors: ['join'],
    },
    { name: 'joins a ternary that fits', code: "const label = active\n  ? 'On'\n  : 'Off'", output: "const label = active ? 'On' : 'Off'", errors: ['join'] },
    { name: 'joins across CRLF', code: 'const result = ready\r\n  ? yes\r\n  : no', output: 'const result = ready ? yes : no', errors: ['join'] },
    { name: 'splits one column over max', code: 'x = a ? b : c', options: { max: 12 }, output: 'x = a\n  ? b\n  : c', errors: ['split'] },
    {
      name: 'splits a ternary over max',
      code: 'const result = ready ? yes : no',
      options: { max: 20 },
      output: 'const result = ready\n  ? yes\n  : no',
      errors: ['split'],
    },
    {
      name: 'counts the rest of the line',
      code: 'const result = ready ? yes : no // a long suffix',
      options: { max: 35 },
      output: 'const result = ready\n  ? yes\n  : no // a long suffix',
      errors: ['split'],
    },
    {
      name: 'keeps parenthesized operands',
      code: 'const result = (ready) ? (yes) : (no)',
      options: { max: 20 },
      output: 'const result = (ready)\n  ? (yes)\n  : (no)',
      errors: ['split'],
    },
    {
      name: 'indent option',
      code: '  const result = ready ? yes : no',
      options: { max: 20, indent: 4 },
      output: '  const result = ready\n      ? yes\n      : no',
      errors: ['split'],
    },
    {
      name: 'keeps CRLF line endings',
      code: 'const result = ready ? yes : no\r\n',
      options: { max: 20 },
      output: 'const result = ready\r\n  ? yes\r\n  : no\r\n',
      errors: ['split'],
    },
    {
      name: 'splits a long ternary in a call argument',
      code: "function run() {\n  if (ready) {\n    callTool.mockResolvedValueOnce(body instanceof Error ? { isError: true, content: [{ type: 'text', text: body.message }] } : { content: [{ type: 'text', text: JSON.stringify(body) }] });\n  }\n}",
      output: "function run() {\n  if (ready) {\n    callTool.mockResolvedValueOnce(body instanceof Error\n      ? { isError: true, content: [{ type: 'text', text: body.message }] }\n      : { content: [{ type: 'text', text: JSON.stringify(body) }] });\n  }\n}",
      errors: ['split'],
    },
  ])('$name', (row) => testerRun(layoutTernary, row))
})
