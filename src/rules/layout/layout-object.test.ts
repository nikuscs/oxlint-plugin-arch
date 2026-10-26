import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { layoutObject } from './layout-object.ts'

describe('arch/layout-object', () => {
  it.each([
    { name: 'two properties stay inline', code: 'save({ id, name })' },
    { name: 'already split object passes', code: 'save({\n  id,\n  name,\n  email,\n})' },
    { name: 'objects outside calls pass by default', code: 'const row = { id, name, email }' },
    { name: 'min raises the threshold', code: 'save({ a: 1, b: 2, c: 3 })', options: { min: 4 } },
    { name: 'plain arguments pass', code: 'save(id, name, email)' },
    { name: 'a comment blocks the fix', code: 'save({ a: 1, b: 2, c: 3 /* keep */ })', output: null, errors: ['callArgs'] },
    { name: 'splits a call argument', code: 'save({ id, name, email })', output: 'save({\n  id,\n  name,\n  email\n})', errors: ['callArgs'] },
    { name: 'keeps a trailing comma', code: 'save({ id, name, email, })', output: 'save({\n  id,\n  name,\n  email,\n})', errors: ['callArgs'] },
    { name: 'splits a new argument', code: 'new Box({ id, name, email })', output: 'new Box({\n  id,\n  name,\n  email\n})', errors: ['callArgs'] },
    { name: 'splits a spread', code: 'save({ ...row, id, name })', output: 'save({\n  ...row,\n  id,\n  name\n})', errors: ['callArgs'] },
    { name: 'splits a middle argument', code: 'save(1, { id, name, email }, 2)', output: 'save(1, {\n  id,\n  name,\n  email\n}, 2)', errors: ['callArgs'] },
    {
      name: 'the default scope leaves a nested object inline',
      code: 'save({ a: 1, b: 2, c: { d: 1, e: 2, f: 3 } })',
      output: 'save({\n  a: 1,\n  b: 2,\n  c: { d: 1, e: 2, f: 3 }\n})',
      errors: ['callArgs'],
    },
    {
      name: 'scope all checks every object',
      code: 'const row = { id, name, email }',
      options: { scope: 'all' },
      output: 'const row = {\n  id,\n  name,\n  email\n}',
      errors: ['always'],
    },
    {
      name: 'scope all indents a nested object',
      code: 'const row = {\n  a: 1,\n  b: 2,\n  c: { d: 1, e: 2, f: 3 }\n}',
      options: { scope: 'all' },
      output: 'const row = {\n  a: 1,\n  b: 2,\n  c: {\n    d: 1,\n    e: 2,\n    f: 3\n  }\n}',
      errors: ['always'],
    },
    { name: 'min option', code: 'save({ id, name })', options: { min: 2 }, output: 'save({\n  id,\n  name\n})', errors: ['callArgs'] },
    {
      name: 'tab indent',
      code: '\tsave({ id, name, email })',
      options: { indent: 'tab' },
      output: '\tsave({\n\t\tid,\n\t\tname,\n\t\temail\n\t})',
      errors: ['callArgs'],
    },
    { name: 'keeps CRLF line endings', code: 'save({ id, name, email })\r\n', output: 'save({\r\n  id,\r\n  name,\r\n  email\r\n})\r\n', errors: ['callArgs'] },
    {
      name: 'splits a nested call argument with its indent',
      code: "function run() {\n  execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 1, stdio: ['ignore', 'pipe', 'inherit'] });\n}",
      output: "function run() {\n  execFileSync(cmd, args, {\n    encoding: 'utf8',\n    maxBuffer: 1,\n    stdio: ['ignore', 'pipe', 'inherit']\n  });\n}",
      errors: ['callArgs'],
    },
  ])('$name', (row) => testerRun(layoutObject, row))
})
