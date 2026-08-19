import { test } from 'vitest'
import { noTypeDeclarations } from '../rules/no-type-declarations.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'typeDeclaration' }
const allowErrorKind = [{ allowPattern: 'ErrorKind$' }]

test('no-type-declarations', () => {
  createRuleTester().run(
    'arch/no-type-declarations',
    noTypeDeclarations,
    {
      valid: [
        'export function listAccounts() { return [] }',
        {
          code: "type AccessRequestErrorKind = 'denied'\nexport function requestAccess() { return null }",
          options: allowErrorKind,
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
      ],
    },
  )
})
