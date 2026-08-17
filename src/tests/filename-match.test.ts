import { test } from 'vitest'
import { filenameMatch } from '../rules/filename-match.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{
  pattern: '\\.(auth|public|production|staging)\\.spec\\.ts$',
  message: 'E2E specs must include their environment suffix.',
}]
const error = { messageId: 'mismatch' }

test('filename-match', () => {
  createRuleTester().run(
    'arch/filename-match',
    filenameMatch,
    {
      valid: [
        { filename: '/repo/apps/web/tests/e2e/tests/billing.auth.spec.ts', code: 'export {}', options },
        { filename: '/repo/apps/web/tests/e2e/tests/homepage.public.spec.ts', code: 'export {}', options },
        { filename: '/repo/apps/web/tests/e2e/tests/skew.production.spec.ts', code: 'export {}', options },
      ],
      invalid: [
        { filename: '/repo/apps/web/tests/e2e/tests/billing.spec.ts', code: 'export {}', options, errors: [error] },
        { filename: '/repo/apps/web/tests/e2e/tests/billing.test.ts', code: 'export {}', options, errors: [error] },
      ],
    },
  )
})
