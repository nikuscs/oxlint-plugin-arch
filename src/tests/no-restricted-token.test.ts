import { test } from 'vitest'
import { noRestrictedToken } from '../rules/no-restricted-token.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{ token: 'RouterClient', allowIn: ['/services/rpc.client.ts'] }]
const error = { messageId: 'restricted' }

test('no-restricted-token', () => {
  createRuleTester().run(
    'arch/no-restricted-token',
    noRestrictedToken,
    {
      valid: [
        {
          filename: '/repo/apps/web/src/services/rpc.client.ts',
          code: 'type Client = RouterClient<Router>',
          options,
        },
        {
          filename: '/repo/apps/web/src/hooks/use-client.ts',
          code: 'type Client = OtherClient<Router>',
          options,
        },
        {
          filename: '/repo/apps/web/src/hooks/use-client.ts',
          code: "import type { RouterClient } from './client.ts'\ntype Client = OtherClient<Router>",
          options,
        },
      ],
      invalid: [
        {
          filename: '/repo/apps/web/src/hooks/use-client.ts',
          code: 'type Client = RouterClient<Router>',
          options,
          errors: [error],
        },
        {
          filename: '/repo/apps/web/src/services/other.ts',
          code: 'const client = RouterClient',
          options,
          errors: [error],
        },
        {
          filename: '/repo/apps/web/src/hooks/use-client.ts',
          code: "import type { RouterClient } from './client.ts'\ntype Client = RouterClient<Router>",
          options,
          errors: [error],
        },
      ],
    },
  )
})
