import { describe, it } from 'vitest'
import { noObjectParametersRule } from '../../../../src/vendor/dillon-anti-slop/rules/no-object-parameters.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/no-object-parameters', () => {
  it.each([
    { name: 'an owner contract passes', code: 'export function save(input: Draft) {}' },
    { name: 'a shadowed alias passes', code: 'type Input = object; function save<Input>(input: Input) {}' },
    { name: 'a broad parameter fails', code: 'export function save(input: object) {}', errors: ['objectParameter'] },
    { name: 'an alias remains broad', code: 'type Input = object; function save(input: Input) {}', errors: ['objectParameter'] },
    { name: 'a union remains broad', code: 'function save(input: object | null) {}', errors: ['objectParameter'] },
  ])('$name', (row) => testerRun(noObjectParametersRule, row))
})
