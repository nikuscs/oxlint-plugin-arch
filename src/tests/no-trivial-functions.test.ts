import { test } from 'vitest'
import { noTrivialFunctions } from '../rules/no-trivial-functions.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'trivial' }

test('no-trivial-functions', () => {
  createRuleTester('tsx').run(
    'arch/no-trivial-functions',
    noTrivialFunctions,
    {
      valid: [
        'export function createUser(params: { name: string }) { if (!params.name) { throw new Error(\'missing\') } return saveUser(params) }',
        'export function add(params: { left: number, right: number }) { return params.left + params.right }',
        'export function Title() { return <h1>Title</h1> }',
        'export function makeThing(params: { id: string }) { function inner(value: string) { return fetchValue(value) } return inner(params.id) }',
        {
          code: 'export function makeClient() { return createClient() }',
          options: [{ allowPattern: '^(create|make)[A-Z]' }],
        },
      ],
      invalid: [
        { code: 'export function load() {}', errors: [error] },
        { code: 'export function loadUser(id: string) { return fetchUser(id) }', errors: [error] },
        {
          code: 'export function getDomainIconKey(domainLabel: string): DomainIconKey { return DOMAIN_ICON_BY_LABEL[domainLabel] ?? \'stack\' }',
          errors: [error],
        },
        {
          code: 'function canvasAmountLabel(amount: string | number | null | undefined): string { return formatCurrency({ value: amount, compact: true }).replace(/\\s*kr\\.$/, \'\') }',
          errors: [error],
        },
        { code: 'const toName = (user: User) => user.name', errors: [error] },
      ],
    },
  )
})
