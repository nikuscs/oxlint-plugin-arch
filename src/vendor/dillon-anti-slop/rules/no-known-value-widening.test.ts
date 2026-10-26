import { describe, it } from 'vitest'
import { testerRun } from '../../../utils/tester.utils.ts'
import { noKnownValueWideningRule } from './no-known-value-widening.ts'

describe('dillon-anti-slop/no-known-value-widening', () => {
  it.each([
    { name: 'inference preserves evidence', code: 'const config = { retries: 3, verbose: true } satisfies Config' },
    { name: 'an empty dictionary passes', code: 'const config: Record<string, unknown> = {}' },
    { name: 'an external call has no known evidence', code: 'const config: unknown = load()' },
    { name: 'a broad annotation loses evidence', code: 'const config: unknown = { retries: 3 }', errors: ['widening'] },
    { name: 'a populated dictionary loses evidence', code: 'const config: Record<string, unknown> = { retries: 3, verbose: true }', errors: ['widening'] },
    { name: 'a broad return loses evidence', code: 'function load(): unknown { return { retries: 3 } }', errors: ['widening'] },
    { name: 'a broad assertion loses evidence', code: 'const config = { retries: 3 } as object', errors: ['widening'] },
  ])('$name', (row) => testerRun(noKnownValueWideningRule, row))
})
