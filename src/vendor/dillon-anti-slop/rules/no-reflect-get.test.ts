import { describe, it } from 'vitest'
import { testerRun } from '../../../utils/tester.utils.ts'
import { noReflectGetRule } from './no-reflect-get.ts'

describe('dillon-anti-slop/no-reflect-get', () => {
  it.each([
    { name: 'typed property access passes', code: 'const name = user.name' },
    { name: 'a shadowed Reflect passes', code: "function run(Reflect: Reader) { Reflect.get(user, 'name') }" },
    { name: 'a global Reflect call fails', code: "const name = Reflect.get(user, 'name')", errors: ['reflectGet'] },
    { name: 'computed access fails', code: "Reflect['get'](user, 'name')", errors: ['reflectGet'] },
  ])('$name', (row) => testerRun(noReflectGetRule, row))
})
