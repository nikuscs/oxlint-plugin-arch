import { test } from 'vitest'
import { noTypeDeclarations } from '../rules/no-type-declarations.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'typeDeclaration' }
const allowErrorKind = [{ allowPattern: 'ErrorKind$' }]

test('no-type-declarations', () => {
  createRuleTester().run('arch/no-type-declarations', noTypeDeclarations, {
    valid: [
      'export function listAccounts() { return [] }',
      {
        code: "type AccessRequestErrorKind = 'denied'\nexport function requestAccess() { return null }",
        options: allowErrorKind,
      },
      {
        code: 'const makeRetry = () => ({})\nexport type Retry = ReturnType<typeof makeRetry>',
        options: [{ allowPattern: '^= ReturnType<typeof ' }],
      },
      {
        code: 'export type Retry = ReturnType<typeof makeRetry>\nexport interface OrderService {}',
        options: [{ allowPattern: ['Service$', '^= ReturnType<typeof '] }],
      },
    ],
    invalid: [
      {
        filename: '/repo/src/api/accounts.ts',
        code: 'interface KfcProposal {}\nexport function listAccounts() { return [] }',
        errors: [error],
      },
      {
        filename: '/repo/src/api/accounts.ts',
        code: 'type DraftStatus = {}\nexport function listAccounts() { return [] }',
        errors: [error],
      },
      {
        filename: '/repo/src/api/accounts.ts',
        code: "type DraftStatus = {}\ntype AccessRequestErrorKind = 'denied'",
        options: allowErrorKind,
        errors: [error],
      },
      {
        code: "type AccessRequestErrorKind = 'denied'",
        options: [{ allowPattern: '' }],
        errors: [error],
      },
      {
        code: 'type Retry = { run: ReturnType<typeof makeRetry> }\ninterface RetryDeps {}',
        options: [{ allowPattern: '^= ReturnType<typeof ' }],
        errors: [error, error],
      },
      {
        code: 'type Draft = AccessRequestErrorKind',
        options: allowErrorKind,
        errors: [error],
      },
    ],
  })
})
