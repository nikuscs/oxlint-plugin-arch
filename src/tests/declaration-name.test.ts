import { test } from 'vitest'
import { declarationName } from '../rules/declaration-name.ts'
import { createRuleTester } from './rule-tester.ts'

const prefix = { messageId: 'prefix' }
const pattern = { messageId: 'pattern' }

test('declaration-name', () => {
  createRuleTester().run(
    'arch/declaration-name',
    declarationName,
    {
      valid: [
        {
          filename: '/repo/src/api/agent-setups.types.ts',
          code: 'type AgentSetupTimeTrigger = {}\nconst agentSetupDraft = {}\nfunction agentSetupLoad() { return null }',
          options: [{ singularize: 'trailing-s' }],
        },
        {
          filename: '/repo/src/api/agent-setup-drafts.types.ts',
          code: 'type AgentSetupDraftStatus = {}\nconst leftover = 1',
          options: [{ kinds: ['type', 'interface'], singularize: 'trailing-s' }],
        },
        {
          filename: '/repo/src/api/accounts.ts',
          code: "const listAccounts = () => []\ntype AccessRequestErrorKind = 'denied'",
          options: [{ kinds: ['const', 'function'], pattern: '^[a-z]+[A-Z]', allowPattern: 'ErrorKind$' }],
        },
      ],
      invalid: [
        {
          filename: '/repo/src/api/agent-setups.types.ts',
          code: 'type DraftStatus = {}\nconst leftover = 1',
          options: [{ singularize: 'trailing-s' }],
          errors: [prefix, prefix],
        },
        {
          filename: '/repo/src/api/agent-setup-drafts.types.ts',
          code: 'type DraftStatus = {}\nconst leftover = 1',
          options: [{ kinds: ['type'], singularize: 'trailing-s' }],
          errors: [prefix],
        },
        {
          filename: '/repo/src/api/accounts.ts',
          code: 'const leftover = 1\nfunction listAccounts() { return [] }',
          options: [{ kinds: ['const', 'function'], pattern: '^list[A-Z]' }],
          errors: [pattern],
        },
      ],
    },
  )
})
