import { test } from 'vitest'
import { keyValueSameLine } from '../rules/key-value-same-line.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'sameLine' }

test('key-value-same-line', () => {
  createRuleTester().run('arch/key-value-same-line', keyValueSameLine, {
    valid: [
      'const row = { id: 1, name: "a" }',
      'const row = {\n  id: 1,\n  name: "a"\n}',
      'const row = {\n  nested: {\n    id: 1\n  }\n}',
      'const { id,\n  name } = row',
      '({ id,\n  name } = row)',
      'const row = { id, name }',
      'const row = {\n  save() {},\n  get id() { return 1 }\n}',
      'const row = {\n  [key]: 1\n}',
      'const row = {\n  [\n    key\n  ]: 1\n}',
    ],
    invalid: [
      {
        code: 'const row = {\n  id:\n    1\n}',
        output: 'const row = {\n  id: 1\n}',
        errors: [error],
      },
      {
        code: 'const row = {\n  id\n    : 1\n}',
        output: 'const row = {\n  id: 1\n}',
        errors: [error],
      },
      {
        code: 'const row = {\n  nested: {\n    id:\n      1\n  }\n}',
        output: 'const row = {\n  nested: {\n    id: 1\n  }\n}',
        errors: [error],
      },
      {
        code: 'save({\n  id:\n    1\n})',
        output: 'save({\n  id: 1\n})',
        errors: [error],
      },
      {
        code: 'const row = {\n  [key]:\n    1\n}',
        output: 'const row = {\n  [key]: 1\n}',
        errors: [error],
      },
      {
        code: 'const row = {\n  id:\r\n    1\n}',
        output: 'const row = {\n  id: 1\n}',
        errors: [error],
      },
      {
        code: 'const row = {\n  id: /* keep */\n    1\n}',
        errors: [error],
      },
      {
        code: 'const row = {\n  id:\n    // keep\n    1\n}',
        errors: [error],
      },
    ],
  })
})
