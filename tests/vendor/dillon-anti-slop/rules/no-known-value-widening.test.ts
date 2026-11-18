import { describe, it } from 'vitest'
import { noKnownValueWideningRule } from '../../../../src/vendor/dillon-anti-slop/rules/no-known-value-widening.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/no-known-value-widening', () => {
  it.each([
    { name: 'inference preserves evidence', code: 'const config = { retries: 3, verbose: true } satisfies Config' },
    { name: 'an empty dictionary passes', code: 'const config: Record<string, unknown> = {}' },
    { name: 'an external call has no known evidence', code: 'const config: unknown = load()' },
    { name: 'a broad annotation loses evidence', code: 'const config: unknown = { retries: 3 }', errors: ['widening'] },
    { name: 'a populated dictionary loses evidence', code: 'const config: Record<string, unknown> = { retries: 3, verbose: true }', errors: ['widening'] },
    { name: 'a broad return loses evidence', code: 'function load(): unknown { return { retries: 3 } }', errors: ['widening'] },
    { name: 'a broad assertion loses evidence', code: 'const config = { retries: 3 } as object', errors: ['widening'] },
    { name: 'a finite-key record passes', code: "type Diet = 'vegan' | 'omnivore'; const labels: Record<Diet, string> = { vegan: 'V', omnivore: 'O' }" },
    { name: 'a finite-key record alias passes', code: "type Diet = 'vegan' | 'omnivore'; type Labels = Record<Diet, string>; const labels: Labels = { vegan: 'V', omnivore: 'O' }" },
    { name: 'a readonly finite-key record passes', code: "type Diet = 'vegan' | 'omnivore'; const labels: Readonly<Record<Diet, string>> = { vegan: 'V', omnivore: 'O' }" },
    { name: 'a literal-key record passes', code: "const labels: Record<'a' | 'b', number> = { a: 1, b: 2 }" },
    { name: 'a generic record alias with literal keys passes', code: "type Command = () => void; const startCommand = () => {}; type Index<Key extends PropertyKey, Value> = Record<Key, Value>; const commands: Index<'start', Command> = { start: startCommand }" },
    { name: 'a function-local open alias loses evidence', code: 'type Command = () => void; const startCommand = () => {}; function outer() { type Open = Record<string, Command>; const commands: Open = { start: startCommand } }', errors: ['widening'] },
    { name: 'a literal passed to an unknown predicate loses evidence', code: "function isString(value: unknown): value is string { return true } isString('known')", errors: ['widening'] },
    { name: 'a const passed to an unknown predicate loses evidence', code: "function isString(value: unknown): value is string { return true } const known = 'known'; isString(known)", errors: ['widening'] },
    { name: 'a forward predicate call loses evidence', code: "isString('known'); function isString(value: string | unknown): value is string { return true }", errors: ['widening'] },
    { name: 'a typed parameter passed to an unknown predicate loses evidence', code: 'function isString(value: unknown): value is string { return true } function check(known: string): boolean { return isString(known) }', errors: ['widening'] },
    { name: 'a typed binding passed to an arrow predicate loses evidence', code: 'const isString = (value: unknown): value is string => true; const known: string = getValue(); isString(known)', errors: ['widening'] },
    { name: 'a typed call result passed to an unknown predicate loses evidence', code: "type User = { readonly id: string }; function isUser(value: unknown): value is User { return true } function parse(): User { return { id: 'known' } } const user = parse(); isUser(user)", errors: ['widening'] },
    { name: 'an unknown argument passed to an unknown predicate passes', code: 'function isString(value: unknown): value is string { return true } declare const input: unknown; isString(input)' },
    { name: 'a generic alias of string as a record key loses evidence', code: 'type Key<T> = string; const counts: Record<Key<number>, number> = { a: 1 }', errors: ['widening'] },
  ])('$name', (row) => testerRun(noKnownValueWideningRule, row))
})
