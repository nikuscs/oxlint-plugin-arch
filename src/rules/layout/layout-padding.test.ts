import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { layoutPadding } from './layout-padding.ts'

describe('arch/layout-padding', () => {
  it.each([
    { name: 'a blank line before a function passes', code: 'const n = 1\n\nfunction save() {}' },
    { name: 'consecutive variables pass', code: 'const a = 1\nconst b = 2' },
    { name: 'statements on one line pass', code: 'const n = 1; if (n) {}' },
    { name: 'a short block may return directly', code: 'function save() {\n  a()\n  return 1\n}' },
    { name: 'a variable may precede return', code: 'function save() {\n  a()\n  b()\n  const n = 1\n  return n\n}' },
    { name: 'min raises the return threshold', code: 'function save() {\n  a()\n  b()\n  return 1\n}', options: { min: 5 } },
    { name: 'multiline variables pass by default', code: 'const a = {\n  b: 1,\n}\nconst c = 2' },
    { name: 'a padded if passes', code: 'const n = 1\n\nif (n) {}' },
    { name: 'padded exports pass', code: 'export function save() {}\n\nexport class Box {}' },
    { name: 'a padded inner function passes', code: 'function save() {\n  const n = 1\n\n  function inner() {}\n}' },
    {
      name: 'a disable-next-line comment blocks the fix',
      code: 'const n = 1; // oxlint-disable-next-line no-console\nfunction save() { console.log("x") }',
      output: null,
      errors: ['variableAndBlock'],
    },
    {
      name: 'a block disable-next-line comment blocks the fix',
      code: 'const n = 1; /* oxlint-disable-next-line no-console */\nfunction save() { console.log("x") }',
      output: null,
      errors: ['variableAndBlock'],
    },
    { name: 'a comment across the line break blocks the fix', code: 'const n = 1; /* keep\n*/ function save() {}', output: null, errors: ['variableAndBlock'] },
    { name: 'variable then function', code: 'const n = 1\nfunction save() {}', output: 'const n = 1\n\nfunction save() {}', errors: ['variableAndBlock'] },
    { name: 'function then variable', code: 'function save() {}\nconst n = 1', output: 'function save() {}\n\nconst n = 1', errors: ['variableAndBlock'] },
    { name: 'statement then function', code: 'foo()\nfunction save() {}', output: 'foo()\n\nfunction save() {}', errors: ['beforeBlock'] },
    { name: 'function then statement', code: 'function save() {}\nfoo()', output: 'function save() {}\n\nfoo()', errors: ['afterBlock'] },
    {
      name: 'variable then control flow',
      code: 'function outer() {\n  const n = 1\n  if (n) {}\n}',
      output: 'function outer() {\n  const n = 1\n\n  if (n) {}\n}',
      errors: ['variableAndControl'],
    },
    { name: 'control flow then variable', code: 'if (n) {}\nconst n = 1', output: 'if (n) {}\n\nconst n = 1', errors: ['controlAndVariable'] },
    {
      name: 'consecutive control flow',
      code: 'if (n) {}\nfor (const x of xs) {}',
      output: 'if (n) {}\n\nfor (const x of xs) {}',
      errors: ['consecutiveControl'],
    },
    {
      name: 'statement then return',
      code: 'function save() {\n  a()\n  b()\n  return 1\n}',
      output: 'function save() {\n  a()\n  b()\n\n  return 1\n}',
      errors: ['beforeReturn'],
    },
    {
      name: 'min lowers the return threshold',
      code: 'function save() {\n  a()\n  return 1\n}',
      options: { min: 2 },
      output: 'function save() {\n  a()\n\n  return 1\n}',
      errors: ['beforeReturn'],
    },
    {
      name: 'multiline pads multiline variables',
      code: 'const a = {\n  b: 1,\n}\nconst c = 2',
      options: { multiline: true },
      output: 'const a = {\n  b: 1,\n}\n\nconst c = 2',
      errors: ['multilineVariable'],
    },
    {
      name: 'an exported function counts as a function',
      code: 'const n = 1\nexport function save() {}',
      output: 'const n = 1\n\nexport function save() {}',
      errors: ['variableAndBlock'],
    },
    {
      name: 'inserts above a leading comment',
      code: 'const n = 1\n// keep me\nfunction save() {}',
      output: 'const n = 1\n\n// keep me\nfunction save() {}',
      errors: ['variableAndBlock'],
    },
    {
      name: 'inserts below a trailing comment',
      code: 'const n = 1 // keep me\nfunction save() {}',
      output: 'const n = 1 // keep me\n\nfunction save() {}',
      errors: ['variableAndBlock'],
    },
    {
      name: 'keeps CRLF line endings',
      code: 'const n = 1\r\nfunction save() {}',
      output: 'const n = 1\r\n\r\nfunction save() {}',
      errors: ['variableAndBlock'],
    },
    { name: 'pads a function after a class', code: 'class Box {}\nfunction save() {}', output: 'class Box {}\n\nfunction save() {}', errors: ['beforeBlock'] },
    { name: 'pads an exported class after a declaration', code: 'const n = 1\nexport class Box {}', output: 'const n = 1\n\nexport class Box {}', errors: ['variableAndBlock'] },
    {
      name: 'pads a default export after a variable',
      code: 'const n = 1\nexport default function save() {}',
      output: 'const n = 1\n\nexport default function save() {}',
      errors: ['variableAndBlock'],
    },
  ])('$name', (row) => testerRun(layoutPadding, row))
})
