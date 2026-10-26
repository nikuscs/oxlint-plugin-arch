import { describe, it } from 'vitest'
import { testerRun } from '../../../utils/tester.utils.ts'
import { noUnknownReturnsRule } from './no-unknown-returns.ts'

describe('dillon-anti-slop/no-unknown-returns', () => {
  it.each([
    { name: 'an owner contract passes', code: 'function load(): User { return user }' },
    { name: 'a promised owner contract passes', code: 'async function load(): Promise<User> { return user }' },
    { name: 'an unknown return fails', code: 'function load(): unknown { return user }', errors: ['unknownReturn'] },
    { name: 'a promised unknown fails', code: 'async function load(): Promise<unknown> { return user }', errors: ['unknownReturn'] },
    { name: 'an aliased unknown fails', code: 'type Result = unknown; function load(): Result { return user }', errors: ['unknownReturn'] },
  ])('$name', (row) => testerRun(noUnknownReturnsRule, row))
})
