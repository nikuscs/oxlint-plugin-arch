import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { codeObjectParams } from './code-object-params.ts'

describe('arch/code-object-params', () => {
  it.each([
    { name: 'inline object parameter passes', code: 'export function createUser(params: { name: string }) {}' },
    { name: 'destructured reference passes', code: 'export const createUser = ({ name }: CreateUserInput) => name' },
    { name: 'parameterless function passes', code: 'export function listUsers() {}' },
    { name: 'untyped parameter passes', code: 'export function createUser(params) {}' },
    { name: 'intersection type passes', code: 'export function createUser(params: Input & Context) {}' },
    { name: 'defaulted object passes', code: 'export function createUser(params: Input = defaults) {}' },
    { name: 'private function is ignored by default', code: 'function helper(first: string, second: string) {}' },
    { name: 'raised maximum allows two objects', code: 'export function makeService(deps: Deps, params: Params) {}', options: { max: 2 } },
    {
      name: 'nested functions remain outside all mode',
      code: 'export function createUser(params: Input) { function nested(first: string, second: string) {} }',
      options: { all: true },
    },
    { name: 'name pattern exempts a function', code: 'export function createUser(name: string) {}', options: { allow: '^create' } },
    { name: 'pattern list exempts a function', code: 'export function makeUser(name: string) {}', options: { allow: ['^create', '^make'] } },
    { name: 'service methods are ignored by default', code: 'export const service = { load(id: string) {} }' },
    { name: 'object service method passes', code: 'export const service = { load(params: Input) {} }', options: { services: true } },
    { name: 'a destructured object param passes', code: 'export const createUser = ({ name }: CreateUserParams) => name' },
    { name: 'two params within max pass', code: 'export const makeService = (deps: Deps, { id }: Params) => id', options: { max: 2 } },
    { name: 'one destructured param within max passes', code: 'export function makeService({ db }: Deps) {}', options: { max: 2 } },
    {
      name: 'an unexported function declaration with an object param passes in all mode',
      code: 'function helper({ id }: Params) {}\nexport function createUser(params: { name: string }) {}',
      options: { all: true },
    },
    {
      name: 'an unexported arrow with an object param passes in all mode',
      code: 'const helper = ({ id }: Params) => id\nexport function createUser(params: { name: string }) {}',
      options: { all: true },
    },
    {
      name: 'a nested function is skipped in all mode',
      code: 'export function createUser(params: { name: string }) { function nested(first: string, second: string) {} }',
      options: { all: true },
    },
    {
      name: 'an allowed name passes with several patterns',
      code: 'export function makeUser(name: string, email: string) {}',
      options: { allow: ['^create', '^make'] },
    },
    {
      name: 'an allowed helper passes in all mode',
      code: 'function helper(first: string, second: string) {}\nexport function createUser(params: { name: string }) {}',
      options: { all: true, allow: '^helper$' },
    },
    { name: 'primitive parameter fails', code: 'export const createUser = (name: string) => name', errors: ['objectParams'] },
    { name: 'multiple parameters fail', code: 'export function createUser(name: string, email: string) {}', errors: ['objectParams'] },
    { name: 'later export is checked', code: 'function createUser(name: string) {}\nexport { createUser }', errors: ['objectParams'] },
    { name: 'default function expression is checked', code: 'export default (function (name: string) {})', errors: ['objectParams'] },
    { name: 'default value does not hide a primitive', code: 'export function createUser(name: string = "guest") {}', errors: ['objectParams'] },
    { name: 'array parameter is not an object parameter', code: 'export function createUsers(names: string[]) {}', errors: ['objectParams'] },
    {
      name: 'raised maximum does not allow primitives',
      code: 'export function makeService(deps: Deps, name: string) {}',
      options: { max: 2 },
      errors: ['objectParams'],
    },
    {
      name: 'raised maximum still limits count',
      code: 'export function makeService(deps: Deps, params: Params, extra: Extra) {}',
      options: { max: 2 },
      errors: ['objectParams'],
    },
    { name: 'all mode checks private arrows', code: 'const helper = (first: string) => first', options: { all: true }, errors: ['objectParams'] },
    {
      name: 'services mode checks exported object methods',
      code: 'export const service = { load(id: string) {} }',
      options: { services: true },
      errors: ['objectParams'],
    },
    {
      name: 'allow pattern does not hide other functions',
      code: 'export function createUser(name: string) {}\nexport function listUsers(filter: string) {}',
      options: { allow: '^create' },
      errors: ['objectParams'],
    },
    {
      name: 'three params over max two',
      code: 'export const makeService = (name: string, email: string) => name',
      options: { max: 2 },
      errors: ['objectParams'],
    },
    {
      name: 'an unexported helper in all mode',
      code: 'function helper(first: string) {}\nexport function createUser(name: string) {}',
      options: { all: true },
      errors: ['objectParams', 'objectParams'],
    },
  ])('$name', (row) => testerRun(codeObjectParams, row))
})
