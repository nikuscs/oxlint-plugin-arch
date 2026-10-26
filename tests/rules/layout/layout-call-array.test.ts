import { describe, it } from 'vitest'
import { layoutCallArray } from '../../../src/rules/layout/layout-call-array.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/layout-call-array', () => {
  it.each([
    { name: 'one element stays inline', code: 'Promise.all([first])' },
    { name: 'already split array passes', code: 'Promise.all([\n  first,\n  second\n])' },
    { name: 'a local Promise binding is skipped', code: 'function run(Promise: { all(values: unknown[]): void }) { Promise.all([first, second]) }' },
    { name: 'other callees are skipped', code: 'queue.run([first, second])', options: { callees: ['batch.run'] } },
    { name: 'min raises the threshold', code: 'Promise.all([first, second])', options: { min: 3 } },
    { name: 'an empty callees list disables the rule', code: 'Promise.all([first, second])', options: { callees: [] } },
    { name: 'an array hole blocks the fix', code: 'Promise.all([first, , third])', output: null, errors: ['multiline'] },
    { name: 'a comment blocks the fix', code: 'Promise.all([first /* keep */, second])', output: null, errors: ['multiline'] },
    { name: 'splits a Promise.all array', code: 'Promise.all([first, second])', output: 'Promise.all([\n  first,\n  second\n])', errors: ['multiline'] },
    {
      name: 'keeps a trailing comma',
      code: 'Promise.allSettled([first, second,])',
      output: 'Promise.allSettled([\n  first,\n  second,\n])',
      errors: ['multiline'],
    },
    {
      name: 'keeps parentheses around elements',
      code: 'Promise.all([(first), ((second as Task))])',
      output: 'Promise.all([\n  (first),\n  ((second as Task))\n])',
      errors: ['multiline'],
    },
    {
      name: 'indents from the array line',
      code: 'function run() {\n  return Promise.all([first, second])\n}',
      output: 'function run() {\n  return Promise.all([\n    first,\n    second\n  ])\n}',
      errors: ['multiline'],
    },
    {
      name: 'custom callees',
      code: 'const batch = queue; batch.run([first, second])',
      options: { callees: ['batch.run'] },
      output: 'const batch = queue; batch.run([\n  first,\n  second\n])',
      errors: ['multiline'],
    },
    {
      name: 'tab indent',
      code: 'Promise.all([first, second])',
      options: { indent: 'tab' },
      output: 'Promise.all([\n\tfirst,\n\tsecond\n])',
      errors: ['multiline'],
    },
  ])('$name', (row) => testerRun(layoutCallArray, row))
})
