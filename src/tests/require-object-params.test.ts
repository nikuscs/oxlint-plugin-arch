import { test } from 'vitest'
import { requireObjectParams } from '../rules/require-object-params.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'objectParams' }
const twoParams = [{ maxParams: 2 }]
const allDeclarations = [{ allDeclarations: true }]

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
        {
          code: 'export function makeService(deps: Deps, params: Params) {}',
          options: twoParams,
        },
        {
          code: 'export const makeService = (deps: Deps, { id }: Params) => id',
          options: twoParams,
        },
        {
          code: 'export function makeService({ db }: Deps) {}',
          options: twoParams,
        },
        {
          code: 'function helper({ id }: Params) {}\nexport function createUser(params: { name: string }) {}',
          options: allDeclarations,
        },
        {
          code: 'const helper = ({ id }: Params) => id\nexport function createUser(params: { name: string }) {}',
          options: allDeclarations,
        },
        {
          code: 'export function createUser(params: { name: string }) { function nested(first: string, second: string) {} }',
          options: allDeclarations,
        },
        {
          code: 'export function createUser(name: string, email: string) {}',
          options: [{ allowPattern: '^create' }],
        },
        {
          code: 'function helper(first: string, second: string) {}\nexport function createUser(params: { name: string }) {}',
          options: [{ allDeclarations: true, allowPattern: '^helper$' }],
        },
        {
          code: 'export function makeService(deps: Deps, params: Params, extra: Extra) {}',
          options: [{ maxParams: 2, allowPattern: '^make' }],
        },
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
        {
          code: 'export function makeService(deps: Deps, params: Params, extra: Extra) {}',
          options: twoParams,
          errors: [error],
        },
        {
          code: 'export function makeService(deps: Deps, name: string) {}',
          options: twoParams,
          errors: [error],
        },
        {
          code: 'export const makeService = (name: string, email: string) => name',
          options: twoParams,
          errors: [error],
        },
        {
          code: 'function helper(first: string, second: string) {}',
          options: allDeclarations,
          errors: [error],
        },
        {
          code: 'const helper = (first: string) => first',
          options: allDeclarations,
          errors: [error],
        },
        {
          code: 'function helper(first: string) {}\nexport function createUser(name: string) {}',
          options: allDeclarations,
          errors: [error, error],
        },
        {
          code: 'export function createUser(name: string) {}\nexport function listUsers(filter: string) {}',
          options: [{ allowPattern: '^create' }],
          errors: [error],
        },
      ],
    },
  )
})
