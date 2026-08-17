import { test } from 'vitest'
import { noRuntimeInTypes } from '../rules/no-runtime-in-types.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'runtimeValue' }

test('no-runtime-in-types', () => {
  createRuleTester().run(
    'arch/no-runtime-in-types',
    noRuntimeInTypes,
    {
      valid: [
        {
          filename: '/repo/apps/web/src/types/account.types.ts',
          code: 'export interface Account { id: string }\nexport type AccountId = string',
        },
        {
          filename: '/repo/apps/web/src/types/account.types.ts',
          code: 'export declare const accountId: string\nexport declare function getAccountId(): string',
        },
      ],
      invalid: [
        {
          filename: '/repo/apps/web/src/types/account.types.ts',
          code: "export const accountId = 'account'",
          errors: [error],
        },
        {
          filename: '/repo/apps/web/src/types/account.types.ts',
          code: "const accountId = 'account'\nexport default accountId",
          errors: [error, error],
        },
        {
          filename: '/repo/apps/web/src/types/account.types.ts',
          code: 'export enum AccountState { Active }',
          errors: [error],
        },
      ],
    },
  )
})
