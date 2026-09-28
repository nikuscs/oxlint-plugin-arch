import { test } from 'vitest'
import { noModuleMutableState } from '../rules/no-module-mutable-state.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'moduleState' }

test('no-module-mutable-state', () => {
  createRuleTester().run('arch/no-module-mutable-state', noModuleMutableState, {
    valid: [
      'const limit = 1',
      'export const limit = 1',
      'function run() { let count = 0; var total = 1; return count + total }',
      '{ let hidden = 1 }',
      'for (let index = 0; index < 1; index++) {}',
      'declare let ambient: number',
      'export declare let ambient: number',
      'declare var ambient: number',
      'declare namespace API { var value: number; let other: number }',
      'export {}; declare global { var value: number; let other: number }',
      "declare module 'x' { var value: number }",
      'class Store { count = 0 }',
      'const { a, b } = values',
      {
        code: 'var cache = {}',
        options: [{ kinds: ['let'] }],
      },
      {
        code: 'let cache = {}',
        options: [{ kinds: ['var'] }],
      },
      {
        code: 'let cache = {}\nexport let unsafeStore = 1',
        options: [{ allowNamePattern: '^(cache|unsafe)' }],
      },
      {
        code: 'let { cache, rest } = values',
        options: [{ allowNamePattern: '^(cache|rest)$' }],
      },
    ],
    invalid: [
      { code: 'let count = 0', errors: [error] },
      { code: 'var count = 0', errors: [error] },
      { code: 'if (enabled) { var cache = {} }; cache.x = 1', errors: [error] },
      { code: '{ var hidden = 1 }', errors: [error] },
      { code: 'for (var index = 0; index < 1; index++) {}', errors: [error] },
      { code: 'for (var key in object) {}', errors: [error] },
      { code: 'for (var item of items) {}', errors: [error] },
      { code: 'export let count = 0', errors: [error] },
      { code: 'export var count = 0', errors: [error] },
      { code: 'let count = 0, total = 1', errors: [error, error] },
      { code: 'let { a, b } = values', errors: [error, error] },
      { code: 'let { a: renamed } = values', errors: [error] },
      { code: 'let { nested: { inner } } = values', errors: [error] },
      { code: 'let [first, , second] = values', errors: [error, error] },
      { code: 'let { ...rest } = values', errors: [error] },
      { code: 'let [head, ...tail] = values', errors: [error, error] },
      { code: 'let { a = 1 } = values', errors: [error] },
      {
        code: 'let cache = {}\nlet other = 1',
        options: [{ allowNamePattern: '^cache$' }],
        errors: [error],
      },
      {
        code: 'let { cache, other } = values',
        options: [{ allowNamePattern: '^cache$' }],
        errors: [error],
      },
      {
        code: 'var count = 0\nlet total = 1',
        options: [{ kinds: ['let'] }],
        errors: [error],
      },
      {
        code: 'var count = 0\nlet total = 1',
        options: [{ kinds: ['var'] }],
        errors: [error],
      },
    ],
  })
})
