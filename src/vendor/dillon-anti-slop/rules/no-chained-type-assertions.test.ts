import { describe, it } from 'vitest'
import { testerRun } from '../../../utils/tester.utils.ts'
import { noChainedTypeAssertionsRule } from './no-chained-type-assertions.ts'

describe('dillon-anti-slop/no-chained-type-assertions', () => {
  it.each([
    { name: 'a parsed value passes', code: 'const user = UserSchema.parse(payload)' },
    { name: 'a single assertion passes', code: 'const user = payload as User' },
    { name: 'a const assertion passes', code: 'const user = { id: 1 } as const' },
    { name: 'a double assertion fails', code: 'const user = payload as unknown as User', errors: ['chained'] },
    { name: 'parentheses do not hide a chain', code: 'const user = (payload as unknown) as User', errors: ['chained'] },
    { name: 'a longer chain reports once', code: 'const user = payload as unknown as object as User', errors: ['chained'] },
  ])('$name', (row) => testerRun(noChainedTypeAssertionsRule, row))
})
