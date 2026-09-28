import { test } from 'vitest'
import { objectMultiline } from '../rules/object-multiline.ts'
import { createRuleTester } from './rule-tester.ts'

const callArgs = { messageId: 'callArgs' }
const always = { messageId: 'always' }

test('object-multiline', () => {
  createRuleTester().run('arch/object-multiline', objectMultiline, {
    valid: [
      'save({ id, name })',
      'save({\n  id,\n  name,\n  email\n})',
      'const row = { id, name, email }',
      'save({\n  id,\n  name,\n  email,\n})',
      'save(id, name, email)',
      {
        code: 'foo({ a: 1, b: 2, c: 3 })',
        options: [{ minProperties: 4 }],
      },
      {
        code: 'const row = { id, name, email }',
        options: [{ scope: 'call-args' }],
      },
      'new Box({\n  id,\n  name,\n  email\n})',
    ],
    invalid: [
      {
        code: 'save({ id, name, email })',
        output: 'save({\n  id,\n  name,\n  email\n})',
        errors: [callArgs],
      },
      {
        code: 'save({ id, name, email, })',
        output: 'save({\n  id,\n  name,\n  email,\n})',
        errors: [callArgs],
      },
      {
        code: 'new Box({ id, name, email })',
        output: 'new Box({\n  id,\n  name,\n  email\n})',
        errors: [callArgs],
      },
      {
        code: 'save(1, { id, name, email }, 2)',
        output: 'save(1, {\n  id,\n  name,\n  email\n}, 2)',
        errors: [callArgs],
      },
      {
        code: 'save({ a: 1, b: 2, c: { d: 1, e: 2, f: 3 } })',
        output: 'save({\n  a: 1,\n  b: 2,\n  c: { d: 1, e: 2, f: 3 }\n})',
        errors: [callArgs],
      },
      {
        code: 'const row = { id, name, email }',
        options: [{ scope: 'all' }],
        output: 'const row = {\n  id,\n  name,\n  email\n}',
        errors: [always],
      },
      {
        code: 'const row = {\n  a: 1,\n  b: 2,\n  c: { d: 1, e: 2, f: 3 }\n}',
        options: [{ scope: 'all' }],
        output: 'const row = {\n  a: 1,\n  b: 2,\n  c: {\n    d: 1,\n    e: 2,\n    f: 3\n  }\n}',
        errors: [always],
      },
      {
        code: 'save({ id, name })',
        options: [{ minProperties: 2 }],
        output: 'save({\n  id,\n  name\n})',
        errors: [callArgs],
      },
      {
        code: 'save({ id, name, email })',
        options: [{ indent: 4 }],
        output: 'save({\n    id,\n    name,\n    email\n})',
        errors: [callArgs],
      },
      {
        code: '\tsave({ id, name, email })',
        options: [{ indent: 'tab' }],
        output: '\tsave({\n\t\tid,\n\t\tname,\n\t\temail\n\t})',
        errors: [callArgs],
      },
      {
        code: 'save({ id, name, email })\r\n',
        output: 'save({\r\n  id,\r\n  name,\r\n  email\r\n})\r\n',
        errors: [callArgs],
      },
      {
        code: 'save({ ...row, id, name })',
        output: 'save({\n  ...row,\n  id,\n  name\n})',
        errors: [callArgs],
      },
      {
        code: 'save({ a: 1, b: 2, c: 3 /* keep */ })',
        errors: [callArgs],
      },
    ],
  })
})
