import { describe, it } from 'vitest'
import { codeFunctionNesting } from '../../../src/rules/code/code-function-nesting.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/code-function-nesting', () => {
  it.each([
    { name: 'four levels pass', code: 'function a() { return () => () => () => 1 }' },
    { name: 'five levels fail', code: 'function a() { return () => () => () => () => 1 }', errors: ['deep'] },
    { name: 'only the first level past max reports', code: 'function a() { return () => () => () => () => () => 1 }', errors: ['deep'] },
    { name: 'max lowers the limit', code: 'function a() { return () => () => 1 }', options: { max: 2 }, errors: ['deep'] },
  ])('$name', (row) => testerRun(codeFunctionNesting, row))
})
