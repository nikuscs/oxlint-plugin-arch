import { test } from 'vitest'
import { requireObjectParams } from '../rules/require-object-params.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'objectParams' }

test('require-object-params', () => {
  createRuleTester().run(
    'arch/require-object-params',
    requireObjectParams,
    {
      valid: [
        'export function createUser(params: { name: string }) {}',
        'export const createUser = ({ name }: CreateUserParams) => name',
        'export function listUsers() {}',
        'function helper(first: string, second: string) {}',
      ],
      invalid: [
        {
          code: 'export function createUser(name: string, email: string) {}',
          errors: [error],
        },
        {
          code: 'export const createUser = (name: string) => name',
          errors: [error],
        },
        {
          code: 'function createUser(name: string) {}\nexport { createUser }',
          errors: [error],
        },
      ],
    },
  )
})
