import { test } from 'vitest'
import { callArrayMultiline } from '../rules/call-array-multiline.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'multiline' }
const allOutput = 'Promise.all([\n  first,\n  second\n])'
const settledOutput = 'Promise.allSettled([\n  first,\n  second,\n])'

test('call-array-multiline', () => {
  createRuleTester().run('arch/call-array-multiline', callArrayMultiline, {
    valid: [
      'Promise.all([first])',
      allOutput,
      settledOutput,
      'function run(Promise: { all(values: unknown[]): void }) { Promise.all([first, second]) }',
      {
        code: 'queue.run([first, second])',
        options: [{ callees: ['batch.run'] }],
      },
      {
        code: 'Promise.all([first, second])',
        options: [{ minElements: 3 }],
      },
      {
        code: 'batch.run([\n  first,\n  second\n])',
        options: [{ callees: ['batch.run'] }],
      },
    ],
    invalid: [
      {
        code: 'Promise.all([first, second])',
        output: allOutput,
        errors: [error],
      },
      {
        code: 'Promise.all([(first), ((second as Task))])',
        output: 'Promise.all([\n  (first),\n  ((second as Task))\n])',
        errors: [error],
      },
      {
        code: 'Promise.allSettled([first, second,])',
        output: settledOutput,
        errors: [error],
      },
      {
        code: 'Promise.all([first, , third])',
        output: null,
        errors: [error],
      },
      {
        code: 'Promise.all([first /* keep */, second])',
        output: null,
        errors: [error],
      },
      {
        code: 'function run() {\n  return Promise.all([first, second])\n}',
        output: 'function run() {\n  return Promise.all([\n    first,\n    second\n  ])\n}',
        errors: [error],
      },
      {
        code: 'batch.run([first, second])',
        output: 'batch.run([\n  first,\n  second\n])',
        options: [{ callees: ['batch.run'], indent: 2 }],
        errors: [error],
      },
      {
        code: 'import { batch } from "queue"; batch.run([first, second])',
        output: 'import { batch } from "queue"; batch.run([\n  first,\n  second\n])',
        options: [{ callees: ['batch.run'] }],
        errors: [error],
      },
      {
        code: 'const batch = queue; batch.run([first, second])',
        output: 'const batch = queue; batch.run([\n  first,\n  second\n])',
        options: [{ callees: ['batch.run'] }],
        errors: [error],
      },
      {
        code: 'Promise.all([first, second])',
        output: 'Promise.all([\n\tfirst,\n\tsecond\n])',
        options: [{ indent: 'tab' }],
        errors: [error],
      },
    ],
  })
})
