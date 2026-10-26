import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { codeConstructor } from './code-constructor.ts'

describe('arch/code-constructor', () => {
  it.each([
    { name: 'unlisted constructor passes', code: 'new DomainError("x")', options: { constructors: ['Error'] } },
    { name: 'plain calls pass by default', code: 'Error("x")', options: { constructors: ['Error'] } },
    { name: 'references are not construction', code: 'const Failure = Error; type FailureType = Error', options: { constructors: ['Error'] } },
    { name: 'dotted names match exactly', code: 'new other.Error()', options: { constructors: ['Error'] } },
    { name: 'empty list disables the rule', code: 'new Error()', options: { constructors: [] } },
    { name: 'clock abstraction passes', code: 'const now = clock.now()', options: { constructors: ['Date'] } },
    { name: 'a subclass of a listed constructor passes', code: 'throw new DomainError("x")', options: { constructors: ['Error'] } },
    { name: 'an unlisted constructor passes', code: 'const value = new Map()', options: { constructors: ['Error'] } },
    { name: 'a call passes without calls', code: 'throw Error("x")', options: { constructors: ['Error'] } },
    { name: 'a type reference passes', code: 'type Failure = Error', options: { constructors: ['Error'] } },
    { name: 'an identifier reference passes', code: 'const Failure = Error', options: { constructors: ['Error'] } },
    { name: 'a member with a listed property passes', code: 'new foo.Error("x")', options: { constructors: ['Error'] } },
    { name: 'a computed member passes', code: 'new foo["Error"]("x")', options: { constructors: ['Error'] } },
    { name: 'an unlisted error type passes', code: 'new RangeError("x")', options: { constructors: ['Error', 'globalThis.Error'] } },
    { name: 'listed constructor fails', code: 'new Error()', options: { constructors: ['Error'] }, errors: ['construct'] },
    { name: 'date construction fails', code: 'const now = new Date()', options: { constructors: ['Date'] }, errors: ['construct'] },
    { name: 'nested constructor fails', code: 'new factory.errors.Failure()', options: { constructors: ['factory.errors.Failure'] }, errors: ['construct'] },
    { name: 'calls can be checked', code: 'Error("x")', options: { constructors: ['Error'], calls: true }, errors: ['call'] },
    { name: 'optional calls are checked', code: 'factory?.Error("x")', options: { constructors: ['factory.Error'], calls: true }, errors: ['call'] },
    {
      name: 'construction and calls report separately',
      code: 'new Error("x"); Error("y")',
      options: { constructors: ['Error'], calls: true },
      errors: ['construct', 'call'],
    },
    {
      name: 'fallback message keeps the construction report',
      code: 'new Error("x")',
      options: { constructors: ['Error'], message: 'Use a domain error.' },
      errors: ['construct'],
    },
    {
      name: 'per-constructor hints coexist with fallback hints',
      code: 'new Error("x"); new TypeError("y")',
      options: { constructors: [{ name: 'Error', message: 'Use DomainError.' }, 'TypeError'], message: 'Use a domain error.' },
      errors: ['construct', 'construct'],
    },
    { name: 'a thrown listed constructor', code: 'throw new Error("x")', options: { constructors: ['Error'] }, errors: ['construct'] },
    { name: 'a globalThis constructor', code: 'new globalThis.Error("x")', options: { constructors: ['globalThis.Error'] }, errors: ['construct'] },
    { name: 'a deep member constructor', code: 'new foo.bar.Baz()', options: { constructors: ['foo.bar.Baz'] }, errors: ['construct'] },
    { name: 'an optional member call', code: 'foo?.Error("x")', options: { constructors: ['foo.Error'], calls: true }, errors: ['call'] },
    { name: 'a thrown call', code: 'throw Error("x")', options: { constructors: ['Error'], calls: true }, errors: ['call'] },
    { name: 'a globalThis call', code: 'globalThis.Error("x")', options: { constructors: ['globalThis.Error'], calls: true }, errors: ['call'] },
  ])('$name', (row) => testerRun(codeConstructor, row))
})
