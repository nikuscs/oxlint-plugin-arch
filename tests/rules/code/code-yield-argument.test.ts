import { describe, it } from 'vitest'
import { codeYieldArgument } from '../../../src/rules/code/code-yield-argument.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/code-yield-argument', () => {
  it.each([
    { name: 'a named yield passes', code: 'function* run() { const user = yield* load(); save(user) }' },
    { name: 'a plain yield argument passes', code: 'function* run() { save(yield load()) }' },
    { name: 'a delegated yield argument fails', code: 'function* run() { save(yield* load()) }', errors: ['named'] },
    { name: 'a delegated yield receiver fails', code: 'function* run() { (yield* load()).save() }', errors: ['named'] },
  ])('$name', (row) => testerRun(codeYieldArgument, row))
})
