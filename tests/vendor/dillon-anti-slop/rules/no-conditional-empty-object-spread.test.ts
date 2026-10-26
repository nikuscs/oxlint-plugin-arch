import { describe, it } from 'vitest'
import { noConditionalEmptyObjectSpreadRule } from '../../../../src/vendor/dillon-anti-slop/rules/no-conditional-empty-object-spread.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/no-conditional-empty-object-spread', () => {
  it.each([
    { name: 'an unconditional spread passes', code: 'const query = { ...options }' },
    { name: 'two populated branches pass', code: 'const query = { ...(cursor ? { cursor } : { limit: 10 }) }' },
    { name: 'array spreads are ignored', code: 'const values = [...(ready ? items : [])]' },
    { name: 'an empty alternate fails', code: 'const query = { limit, ...(cursor ? { cursor } : {}) }', errors: ['avoid'] },
    { name: 'an empty consequent fails', code: 'const query = { ...(cursor ? {} : { limit: 10 }) }', errors: ['avoid'] },
  ])('$name', (row) => testerRun(noConditionalEmptyObjectSpreadRule, row))
})
