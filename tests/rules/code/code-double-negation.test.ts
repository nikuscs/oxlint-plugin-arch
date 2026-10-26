import { describe, it } from 'vitest'
import { codeDoubleNegation } from '../../../src/rules/code/code-double-negation.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/code-double-negation', () => {
  it.each([
    { name: 'explicit comparison passes', code: 'const hasUser = user !== undefined' },
    { name: 'boolean conversion passes', code: 'const hasUser = Boolean(user)' },
    { name: 'single negation passes', code: 'const missing = !user' },
    { name: 'separated negations pass', code: 'const missing = !Boolean(!user)' },
    { name: 'double negation fails', code: 'const hasUser = !!user', errors: ['forbidden'] },
    { name: 'parentheses do not hide double negation', code: 'const hasUser = !(!user)', errors: ['forbidden'] },
    { name: 'overlapping double negations each report', code: 'const missing = !!!user', errors: ['forbidden', 'forbidden'] },
    { name: 'custom message replaces the default', code: '!!user', options: { message: 'Compare explicitly.' }, errors: ['Compare explicitly.'] },
  ])('$name', (row) => testerRun(codeDoubleNegation, row))
})
