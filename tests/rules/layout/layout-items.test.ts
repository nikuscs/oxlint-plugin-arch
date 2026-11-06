import { describe, it } from 'vitest'
import { layoutItems } from '../../../src/rules/layout/layout-items.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/layout-items', () => {
  it.each([
    { name: 'a one-line object passes', code: 'const user = { id, name }' },
    { name: 'one item per line passes', code: 'const user = {\n  id,\n  name,\n}' },
    { name: 'a single item passes', code: 'const user = { id: {\n  a,\n} }' },
    { name: 'a packed object fails', code: 'const user = {\n  id, name,\n}', output: 'const user = {\n  id,\n  name,\n}', errors: ['object'] },
    { name: 'a packed array fails', code: 'const list = [a, b,\n  c]', output: 'const list = [\n  a,\n  b,\n  c\n]', errors: ['array'] },
    { name: 'the fix keeps a missing trailing comma', code: 'const user = { id,\n  name }', output: 'const user = {\n  id,\n  name\n}', errors: ['object'] },
    { name: 'a hole reports without a fix', code: 'const list = [a, , b,\n  c]', output: null, errors: ['array'] },
    { name: 'a comment reports without a fix', code: 'const user = {\n  id, /* keep */ name,\n}', output: null, errors: ['object'] },
  ])('$name', (row) => testerRun(layoutItems, row))
})
