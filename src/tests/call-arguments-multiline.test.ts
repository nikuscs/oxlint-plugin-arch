import { test } from 'vitest'
import { callArgumentsMultiline } from '../rules/call-arguments-multiline.ts'
import { createRuleTester } from './rule-tester.ts'

test('call-arguments-multiline', () => {
  createRuleTester().run('arch/call-arguments-multiline', callArgumentsMultiline, {
    valid: [
      'save(a, b)',
      'save(\n  a,\n  b,\n  c,\n)',
      'save(\n a,\n b,\n c\n)',
      'save(a, /* keep */ b, c)',
      'save((a), b, c)',
      'save(a, (b), c)',
      'save(a, b, (c))',
      'describe(\'x\', options, () => {\n  run()\n})',
      'describe(\'x\', options, function () {\n  run()\n})',
      {
        code: 'describe(\'x\', () => {\n  run()\n})',
        options: [{ minArguments: 2 }],
      },
      {
        code: 'save(a, b, c)',
        options: [{ minArguments: 4 }],
      },
      'save(\n  a,\n  b,\n  ...rest\n)',
      'save(\n  a,\n  b,\n  ...rest,\n)',
      'new Box(\n  a,\n  b,\n  ...rest,\n)',
    ],
    invalid: [
      {
        code: 'save(a, b, c)',
        output: 'save(\n  a,\n  b,\n  c,\n)',
        errors: [{ messageId: 'multiline' }],
      },
      {
        code: 'save(a, b, c,)',
        output: 'save(\n  a,\n  b,\n  c,\n)',
        errors: [{ messageId: 'multiline' }],
      },
      {
        code: 'new Box(a, b, c)',
        output: 'new Box(\n  a,\n  b,\n  c,\n)',
        errors: [{ messageId: 'multiline' }],
      },
      {
        code: 'save<T>(a, b, c)',
        output: 'save<T>(\n  a,\n  b,\n  c,\n)',
        errors: [{ messageId: 'multiline' }],
      },
      {
        code: 'save?.(a, b, c)',
        output: 'save?.(\n  a,\n  b,\n  c,\n)',
        errors: [{ messageId: 'multiline' }],
      },
      {
        code: 'save(a, b, ...rest)',
        output: 'save(\n  a,\n  b,\n  ...rest,\n)',
        errors: [{ messageId: 'multiline' }],
      },
      {
        code: 'new Box(a, b, ...rest)',
        output: 'new Box(\n  a,\n  b,\n  ...rest,\n)',
        errors: [{ messageId: 'multiline' }],
      },
      {
        code: 'save(a,\n  b,\n  c)',
        output: 'save(\n  a,\n  b,\n  c,\n)',
        errors: [{ messageId: 'multiline' }],
      },
      {
        code: '  save(a, b)',
        output: '  save(\n      a,\n      b,\n  )',
        errors: [{ messageId: 'multiline' }],
        options: [{ minArguments: 2, indent: 4 }],
      },
      {
        code: 'save(a, b, c)\r\n',
        output: 'save(\r\n  a,\r\n  b,\r\n  c,\r\n)\r\n',
        errors: [{ messageId: 'multiline' }],
      },
      {
        code: 'save(a, b, () => c)',
        output: 'save(\n  a,\n  b,\n  () => c,\n)',
        errors: [{ messageId: 'multiline' }],
      },
      {
        code: 'save(a, b, {\n  value: c\n})',
        output: 'save(\n  a,\n  b,\n  {\n  value: c\n},\n)',
        errors: [{ messageId: 'multiline' }],
      },
    ],
  })
})
