import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { layoutKeyValue } from './layout-key-value.ts'

describe('arch/layout-key-value', () => {
  it.each([
    { name: 'key and value on one line pass', code: "const user = {\n  name: 'Ada',\n}" },
    { name: 'a parenthesized value may open on the key line', code: 'const row = {\n  value: (\n    1 + 2\n  ),\n}' },
    { name: 'a multiline computed key passes', code: 'const row = {\n  [\n    key\n  ]: 1\n}' },
    { name: 'destructuring is skipped', code: 'const { id,\n  name } = row' },
    { name: 'methods and getters are skipped', code: 'const row = {\n  save() {},\n  get id() { return 1 }\n}' },
    { name: 'a one-line object passes', code: 'const row = { id: 1, name: "a" }' },
    { name: 'a nested object on the key line passes', code: 'const row = {\n  nested: {\n    id: 1\n  }\n}' },
    { name: 'a parenthesized value after a computed key passes', code: 'const row = {\n  [key]: (\n    1\n  ),\n}' },
    { name: 'assignment destructuring is skipped', code: '({ id,\n  name } = row)' },
    { name: 'shorthand properties pass', code: 'const row = { id, name }' },
    { name: 'a parenthesized value blocks the fix', code: 'const row = {\n  id:\n    (1)\n}', output: null, errors: ['sameLine'] },
    { name: 'a comment blocks the fix', code: 'const row = {\n  id:\n    // keep\n    1\n}', output: null, errors: ['sameLine'] },
    { name: 'joins a value onto its key', code: "const user = {\n  name:\n    'Ada',\n}", output: "const user = {\n  name: 'Ada',\n}", errors: ['sameLine'] },
    { name: 'joins a colon on the value line', code: 'const row = {\n  id\n    : 1\n}', output: 'const row = {\n  id: 1\n}', errors: ['sameLine'] },
    { name: 'joins after a computed key', code: 'const row = {\n  [key]:\n    1\n}', output: 'const row = {\n  [key]: 1\n}', errors: ['sameLine'] },
    { name: 'joins across CRLF', code: 'const row = {\n  id:\r\n    1\n}', output: 'const row = {\n  id: 1\n}', errors: ['sameLine'] },
    { name: 'joins a value in a call argument object', code: 'save({\n  id:\n    1\n})', output: 'save({\n  id: 1\n})', errors: ['sameLine'] },
    { name: 'a block comment after the colon', code: 'const row = {\n  id: /* keep */\n    1\n}', errors: ['sameLine'] },
  ])('$name', (row) => testerRun(layoutKeyValue, row))
})
