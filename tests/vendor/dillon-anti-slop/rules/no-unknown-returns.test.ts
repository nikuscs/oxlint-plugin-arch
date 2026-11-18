import { describe, it } from 'vitest'
import { noUnknownReturnsRule } from '../../../../src/vendor/dillon-anti-slop/rules/no-unknown-returns.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/no-unknown-returns', () => {
  it.each([
    { name: 'an owner contract passes', code: 'function load(): User { return user }' },
    { name: 'a promised owner contract passes', code: 'async function load(): Promise<User> { return user }' },
    { name: 'an unknown return fails', code: 'function load(): unknown { return user }', errors: ['unknownReturn'] },
    { name: 'a promised unknown fails', code: 'async function load(): Promise<unknown> { return user }', errors: ['unknownReturn'] },
    { name: 'an aliased unknown fails', code: 'type Result = unknown; function load(): Result { return user }', errors: ['unknownReturn'] },
    { name: 'a closer local alias passes', code: 'type Value = unknown; function outer() { type Value = User; function load(): Value { return user } }' },
    { name: 'a function-local unknown alias fails', code: 'function outer() { type Result = unknown; function load(): Result { return input } }', errors: ['unknownReturn'] },
    { name: 'a generic identity of unknown fails', code: 'type Identity<T> = T; function load(): Identity<unknown> { return input }', errors: ['unknownReturn'] },
    { name: 'a generic promise of unknown fails', code: 'type Identity<T> = T; type Wrapped<T> = Promise<Identity<T>>; function load(): Wrapped<unknown> { return promise }', errors: ['unknownReturn'] },
    { name: 'a named class expression keeps its name to itself', code: 'type Payload = unknown; const C = class Payload {}; function load(): Payload { return null }', errors: ['unknownReturn'] },
    { name: 'an identity of an identity of unknown fails', code: 'type Identity<T> = T; function load(): Identity<Identity<unknown>> { return null }', errors: ['unknownReturn'] },
    { name: 'a recursive alias passes', code: 'type Loop<T> = Loop<T>; function load(): Loop<string> { return null }' },
  ])('$name', (row) => testerRun(noUnknownReturnsRule, row))
})
