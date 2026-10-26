import { describe, it } from 'vitest'
import { noReflectApplyRule } from '../../../../src/vendor/dillon-anti-slop/rules/no-reflect-apply.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/no-reflect-apply', () => {
  it.each([
    { name: 'a typed call passes', code: 'handler(...args)' },
    { name: 'a shadowed Reflect passes', code: 'function run(Reflect: Dispatcher) { Reflect.apply(handler, undefined, args) }' },
    { name: 'a global Reflect call fails', code: 'Reflect.apply(handler, undefined, args)', errors: ['reflectApply'] },
    { name: 'computed access fails', code: "Reflect['apply'](handler, undefined, args)", errors: ['reflectApply'] },
  ])('$name', (row) => testerRun(noReflectApplyRule, row))
})
