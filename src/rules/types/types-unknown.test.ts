import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { typesUnknown } from './types-unknown.ts'

describe('arch/types-unknown', () => {
  it.each([
    { name: 'a type guard subject passes', code: 'function isUser(value: unknown): value is User { return check(value) }' },
    { name: 'an arrow type guard passes', code: 'const isUser = (value: unknown): value is User => check(value)' },
    { name: 'an assertion guard passes', code: 'function assertUser(value: unknown): asserts value is User { check(value) }' },
    { name: 'a catch callback passes', code: 'load().catch((error: unknown) => report(error))' },
    { name: 'a catch function expression passes', code: 'load().catch(function (error: unknown) { report(error) })' },
    { name: 'a catch property passes', code: 'attempt({ try: run, catch: (error: unknown) => toAppError(error) })' },
    { name: 'a catch property signature passes', code: 'interface Attempt { catch: (error: unknown) => AppError }' },
    { name: 'a catch method signature passes', code: 'interface Attempt { catch(error: unknown): AppError }' },
    { name: 'an alias', code: 'type Value = unknown', errors: ['forbidden'] },
    { name: 'a parameter', code: 'function parse(input: unknown) {}', errors: ['forbidden'] },
    { name: 'a variable in a guard', code: 'function isUser(value: User): value is Admin { const raw: unknown = value }', errors: ['forbidden'] },
    { name: 'a second guard parameter', code: 'function isUser(value: unknown, extra: unknown): value is User {}', errors: ['forbidden'] },
    { name: 'a guard return', code: 'function isUser(value: unknown): unknown {}', errors: ['forbidden', 'forbidden'] },
    { name: 'a then callback', code: 'load().then((value: unknown) => value)', errors: ['forbidden'] },
    { name: 'a second catch parameter', code: 'load().catch((error: Error, extra: unknown) => extra)', errors: ['forbidden'] },
    { name: 'a catch return', code: 'interface Attempt { catch: (error: Error) => unknown }', errors: ['forbidden'] },
    { name: 'a non-catch property', code: 'interface Attempt { onError: (error: unknown) => void }', errors: ['forbidden'] },
    { name: 'a computed catch', code: 'load()[method]((error: unknown) => error)', errors: ['forbidden'] },
  ])('$name', (row) => testerRun(typesUnknown, row))
})
