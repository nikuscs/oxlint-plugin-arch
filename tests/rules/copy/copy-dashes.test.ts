import { describe, it } from 'vitest'
import { copyDashes } from '../../../src/rules/copy/copy-dashes.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/copy-dashes', () => {
  it.each([
    { name: 'plain copy passes', code: "const title = 'Fast, and cheap'" },
    { name: 'comments are ignored', code: '// Fast \u2014 and cheap' },
    { name: 'an escaped dash passes', code: "const dash = '\\u2014'" },
    { name: 'en dash passes by default', code: "const range = '1\u20132'" },
    { name: 'string', code: "const title = 'Fast \u2014 and cheap'", errors: ['dash'] },
    { name: 'template text', code: 'const title = `Fast \u2014 now`', errors: ['dash'] },
    { name: 'JSX text', code: 'const Hero = () => <h1>Ship \u2014 today</h1>', errors: ['dash'] },
    { name: 'JSX attribute', code: 'const Hero = () => <img alt="Ship \u2014 today" />', errors: ['dash'] },
    { name: 'one report per dash', code: "const title = 'a \u2014 b \u2014 c'", errors: ['dash', 'dash'] },
    { name: 'custom list', code: "const range = '1\u20132'", options: { deny: ['\u2013'] }, errors: ['dash'] },
    {
      name: 'custom message replaces the hint',
      code: "const title = 'Fast \u2014 and cheap'",
      options: { message: 'Use a comma.' },
      errors: ["Remove '\u2014' from this text. Use a comma."],
    },
  ])('$name', (row) => testerRun(copyDashes, row))
})
