import { describe, it } from 'vitest'
import { testerRun } from '../../../utils/tester.utils.ts'
import { noRuntimeTypeofRule } from './no-runtime-typeof.ts'

describe('dillon-anti-slop/no-runtime-typeof', () => {
  it.each([
    { name: 'parsed input passes', code: 'render(TitleSchema.parse(value))' },
    { name: 'a type query passes', code: 'type Config = typeof config' },
    {
      name: 'type guards can be allowed',
      code: "function isTitle(value: unknown): value is string { return typeof value === 'string' }",
      options: { allowInTypeGuards: true },
    },
    { name: 'a runtime check fails', code: "if (typeof value === 'string') render(value)", errors: ['runtimeTypeof'] },
    {
      name: 'type guards fail by default',
      code: "function isTitle(value: unknown): value is string { return typeof value === 'string' }",
      errors: ['runtimeTypeof'],
    },
    {
      name: 'the exception requires a type predicate',
      code: "function isTitle(value: unknown): boolean { return typeof value === 'string' }",
      options: { allowInTypeGuards: true },
      errors: ['runtimeTypeof'],
    },
  ])('$name', (row) => testerRun(noRuntimeTypeofRule, row))
})
