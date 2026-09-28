import { test } from 'vitest'
import { paddingBetweenStatements } from '../rules/padding-between-statements.ts'
import { createRuleTester } from './rule-tester.ts'

const variableAndBlock = { messageId: 'variableAndBlock' }
const beforeBlock = { messageId: 'beforeBlock' }
const afterBlock = { messageId: 'afterBlock' }
const variableAndControl = { messageId: 'variableAndControl' }
const controlAndVariable = { messageId: 'controlAndVariable' }
const consecutiveControl = { messageId: 'consecutiveControl' }
const beforeReturn = { messageId: 'beforeReturn' }

test('padding-between-statements', () => {
  createRuleTester().run('arch/padding-between-statements', paddingBetweenStatements, {
    valid: [
      'const n = 1\n\nfunction save() {}',
      'function save() {}\n\nconst n = 1',
      'const n = 1\n\nif (n) {}',
      'if (n) {}\n\nconst n = 1',
      'if (n) {}\n\nfor (const x of xs) {}',
      'function save() {\n  a()\n  return 1\n}',
      'function save() {\n  a()\n  b()\n  const n = 1\n  return n\n}',
      'const a = 1\nconst b = 2',
      'const n = 1; if (n) {}',
      'export function save() {}\n\nexport class Box {}',
      {
        code: 'function save() {\n  a()\n  b()\n  return 1\n}',
        options: [{ returnMinStatements: 5 }],
      },
      'function save() {\n  const n = 1\n\n  function inner() {}\n}',
    ],
    invalid: [
      {
        code: 'const n = 1\nfunction save() {}',
        output: 'const n = 1\n\nfunction save() {}',
        errors: [variableAndBlock],
      },
      {
        code: 'function save() {}\nconst n = 1',
        output: 'function save() {}\n\nconst n = 1',
        errors: [variableAndBlock],
      },
      {
        code: 'foo()\nfunction save() {}',
        output: 'foo()\n\nfunction save() {}',
        errors: [beforeBlock],
      },
      {
        code: 'function save() {}\nfoo()',
        output: 'function save() {}\n\nfoo()',
        errors: [afterBlock],
      },
      {
        code: 'class Box {}\nfunction save() {}',
        output: 'class Box {}\n\nfunction save() {}',
        errors: [beforeBlock],
      },
      {
        code: 'const n = 1\nif (n) {}',
        output: 'const n = 1\n\nif (n) {}',
        errors: [variableAndControl],
      },
      {
        code: 'if (n) {}\nconst n = 1',
        output: 'if (n) {}\n\nconst n = 1',
        errors: [controlAndVariable],
      },
      {
        code: 'if (n) {}\nfor (const x of xs) {}',
        output: 'if (n) {}\n\nfor (const x of xs) {}',
        errors: [consecutiveControl],
      },
      {
        code: 'function save() {\n  a()\n  b()\n  return 1\n}',
        output: 'function save() {\n  a()\n  b()\n\n  return 1\n}',
        errors: [beforeReturn],
      },
      {
        code: 'function save() {\n  a()\n  return 1\n}',
        options: [{ returnMinStatements: 2 }],
        output: 'function save() {\n  a()\n\n  return 1\n}',
        errors: [beforeReturn],
      },
      {
        code: 'const n = 1\nexport function save() {}',
        output: 'const n = 1\n\nexport function save() {}',
        errors: [variableAndBlock],
      },
      {
        code: 'const n = 1\nexport class Box {}',
        output: 'const n = 1\n\nexport class Box {}',
        errors: [variableAndBlock],
      },
      {
        code: 'const n = 1\nexport default function save() {}',
        output: 'const n = 1\n\nexport default function save() {}',
        errors: [variableAndBlock],
      },
      {
        code: 'const n = 1\n// keep me\nfunction save() {}',
        output: 'const n = 1\n\n// keep me\nfunction save() {}',
        errors: [variableAndBlock],
      },
      {
        code: 'const n = 1 // keep me\nfunction save() {}',
        output: 'const n = 1 // keep me\n\nfunction save() {}',
        errors: [variableAndBlock],
      },
      {
        code: 'const n = 1; // oxlint-disable-next-line no-console\nfunction save() { console.log("x") }',
        output: null,
        errors: [variableAndBlock],
      },
      {
        code: 'const n = 1; /* oxlint-disable-next-line no-console */\nfunction save() { console.log("x") }',
        output: null,
        errors: [variableAndBlock],
      },
      {
        code: 'const n = 1; /* eslint-disable-next-line no-console */\nfunction save() { console.log("x") }',
        output: null,
        errors: [variableAndBlock],
      },
      {
        code: 'const n = 1; /* keep\n*/ function save() {}',
        errors: [variableAndBlock],
      },
      {
        code: 'const n = 1\r\nfunction save() {}',
        output: 'const n = 1\r\n\r\nfunction save() {}',
        errors: [variableAndBlock],
      },
      {
        code: 'function outer() {\n  const n = 1\n  if (n) {}\n}',
        output: 'function outer() {\n  const n = 1\n\n  if (n) {}\n}',
        errors: [variableAndControl],
      },
    ],
  })
})
