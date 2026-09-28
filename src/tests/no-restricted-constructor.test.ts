import { test } from 'vitest'
import { noRestrictedConstructor } from '../rules/no-restricted-constructor.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{ constructors: ['Error'] }]
const construct = { messageId: 'construct' }
const call = { messageId: 'call' }

test('no-restricted-constructor', () => {
  createRuleTester().run('arch/no-restricted-constructor', noRestrictedConstructor, {
    valid: [
      { code: 'throw new DomainError("x")', options },
      { code: 'const value = new Map()', options },
      { code: 'throw Error("x")', options },
      { code: 'type Failure = Error', options },
      { code: 'const Failure = Error', options },
      { code: 'new foo.Error("x")', options },
      { code: 'new foo["Error"]("x")', options },
      { code: 'Error("x")', options: [{ constructors: ['Error'], checkCalls: false }] },
      { code: 'new RangeError("x")', options: [{ constructors: ['Error', 'globalThis.Error'] }] },
    ],
    invalid: [
      { code: 'new Error()', options, errors: [construct] },
      { code: 'throw new Error("x")', options, errors: [construct] },
      {
        code: 'new globalThis.Error("x")',
        options: [{ constructors: ['globalThis.Error'] }],
        errors: [construct],
      },
      {
        code: 'new foo.bar.Baz()',
        options: [{ constructors: ['foo.bar.Baz'] }],
        errors: [construct],
      },
      {
        code: 'Error("x")',
        options: [{ constructors: ['Error'], checkCalls: true }],
        errors: [call],
      },
      {
        code: 'foo?.Error("x")',
        options: [{ constructors: ['foo.Error'], checkCalls: true }],
        errors: [call],
      },
      {
        code: 'throw Error("x")',
        options: [{ constructors: ['Error'], checkCalls: true }],
        errors: [call],
      },
      {
        code: 'globalThis.Error("x")',
        options: [{ constructors: ['globalThis.Error'], checkCalls: true }],
        errors: [call],
      },
      {
        code: 'new Error("x")\nError("y")',
        options: [{ constructors: ['Error'], checkCalls: true }],
        errors: [construct, call],
      },
      {
        code: 'new Error("x")',
        options: [{ constructors: ['Error'], message: 'Throw a domain error instead.' }],
        errors: [{ message: "Do not construct 'Error'. Throw a domain error instead." }],
      },
      {
        code: 'Error("x")',
        options: [{
          constructors: ['Error'],
          checkCalls: true,
          message: 'Throw a domain error instead.',
        }],
        errors: [{ message: "Do not call 'Error'. Throw a domain error instead." }],
      },
      {
        code: 'new Error("x")\nnew TypeError("y")',
        options: [{
          constructors: [
            { name: 'Error', message: 'Use DomainError.' },
            'TypeError',
          ],
          message: 'Use a domain error.',
        }],
        errors: [
          { message: "Do not construct 'Error'. Use DomainError." },
          { message: "Do not construct 'TypeError'. Use a domain error." },
        ],
      },
    ],
  })
})
