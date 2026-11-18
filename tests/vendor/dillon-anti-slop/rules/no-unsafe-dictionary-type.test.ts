import { describe, it } from 'vitest'
import { noUnsafeDictionaryTypeRule } from '../../../../src/vendor/dillon-anti-slop/rules/no-unsafe-dictionary-type.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/no-unsafe-dictionary-type', () => {
  it.each([
    { name: 'concrete values pass', code: 'type Settings = Record<string, string | number>' },
    { name: 'a named value contract passes', code: 'type Settings = Record<string, User>' },
    { name: 'unknown values fail', code: 'type Settings = Record<string, unknown>', errors: ['unsafeDictionary'] },
    { name: 'any values fail', code: 'type Settings = Record<string, any>', errors: ['unsafeDictionary'] },
    { name: 'object values fail', code: 'type Settings = Record<string, object>', errors: ['unsafeDictionary'] },
    { name: 'empty object values fail', code: 'type Settings = Record<string, {}>', errors: ['unsafeDictionary'] },
    { name: 'an index signature is checked', code: 'interface Settings { [key: string]: unknown }', errors: ['unsafeDictionary'] },
    { name: 'a generic constraint passes', code: 'type WithSchema<T extends Record<string, unknown>> = (schema: T) => void' },
    { name: 'a function generic constraint passes', code: 'function run<T extends Record<string, unknown>>(input: T): T { return input }' },
    { name: 'a class generic constraint passes', code: 'declare class Store<T extends Record<string, unknown>> { read(): T }' },
    { name: 'a readonly generic constraint passes', code: 'type Deep<T extends Readonly<Record<string, unknown>>> = T' },
    { name: 'a function-local identity alias fails', code: 'function outer() { type Identity<T> = T; type A = Record<string, Identity<unknown>> }', errors: ['unsafeDictionary'] },
    { name: 'a local Record shadow only covers its own scope', code: 'function local() { type Record<K, V> = { key: K, value: V }; type A = Record<string, unknown> } function global() { type A = Record<string, unknown> }', errors: ['unsafeDictionary'] },
    { name: 'a class expression named Record does not shadow the built-in', code: 'const C = class Record {}; type Settings = Record<string, unknown>', errors: ['unsafeDictionary'] },
    { name: 'swapped generic arguments keep their values', code: 'type Swap<A extends PropertyKey, B> = Record<A, B>; type Outer<A, B extends PropertyKey> = Swap<B, A>; type Bad = Outer<unknown, string>', errors: ['unsafeDictionary'] },
    { name: 'an identity of an identity of unknown fails', code: 'type Identity<T> = T; type Bad = Record<string, Identity<Identity<unknown>>>', errors: ['unsafeDictionary'] },
  ])('$name', (row) => testerRun(noUnsafeDictionaryTypeRule, row))
})
