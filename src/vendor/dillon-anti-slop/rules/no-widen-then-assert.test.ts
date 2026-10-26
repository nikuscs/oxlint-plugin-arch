import { describe, it } from 'vitest'
import { testerRun } from '../../../utils/tester.utils.ts'
import { noWidenThenAssertRule } from './no-widen-then-assert.ts'

describe('dillon-anti-slop/no-widen-then-assert', () => {
  it.each([
    { name: 'a precise value passes', code: "const user: User = { id: 'a' }" },
    { name: 'an external value has no known evidence', code: 'const raw: unknown = load(); const user = raw as User' },
    { name: 'a widened binding asserted back fails', code: "const raw: unknown = { id: 'a' }; const user = raw as User", errors: ['widenThenAssert'] },
    { name: 'a widening assertion also fails', code: "const raw = { id: 'a' } as unknown; const user = raw as User", errors: ['widenThenAssert'] },
  ])('$name', (row) => testerRun(noWidenThenAssertRule, row))
})
