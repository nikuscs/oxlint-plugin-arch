import { test } from 'vitest'
import { noRestrictedToken } from '../rules/no-restricted-token.ts'
import { createRuleTester } from './rule-tester.ts'

type JsonValue = JsonValue[] | { [key: string]: JsonValue } | string | number | boolean | null

const options = [{ token: 'RouterClient', allowIn: ['/services/rpc.client.ts'] }]
const restrictions: JsonValue[] = [{
  restrictions: [
    { token: 'RouterClient', allowIn: ['/services/rpc.client.ts'] },
    { member: 'process.platform', allowPathPatterns: ['/platform/'] },
    { member: '*.insertInto' },
  ],
}]
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
        {
          filename: '/repo/apps/web/src/hooks/use-client.ts',
          code: 'const client = OtherClient',
          options: [{ token: 'RouterClient' }],
        },
        {
          filename: '/repo/apps/web/src/platform/current.ts',
          code: "const platform = process.platform\nconst value = db['insertInto']('users')",
          options: restrictions,
        },
        {
          filename: '/repo/apps/web/src/services/rpc.client.ts',
          code: "import type { RouterClient } from './client.ts'\nconst platform = other.platform",
          options: restrictions,
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
        {
          filename: '/repo/apps/web/src/hooks/use-client.ts',
          code: 'const client = RouterClient',
          options: [{ token: 'RouterClient' }],
          errors: [error],
        },
        {
          filename: '/repo/apps/web/src/hooks/use-client.ts',
          code: "const platform = process.platform\nprocess.platform()\ndb.insertInto('users')\ntrx.insertInto('users')",
          options: restrictions,
          errors: [error, error, error, error],
        },
        {
          filename: '/repo/apps/web/src/hooks/use-client.ts',
          code: "this.db.insertInto('users')\ndb.selectFrom('a').insertInto('users')",
          options: restrictions,
          errors: [error, error],
        },
        {
          filename: '/repo/apps/web/src/services/rpc.client.ts',
          code: 'const client = RouterClient\nconst platform = process.platform',
          options: restrictions,
          errors: [error],
        },
        {
          filename: '/repo/apps/web/src/hooks/use-client.ts',
          code: 'const legacy = RouterClient\nconst platform = process.platform',
          options: [{
            token: 'RouterClient',
            restrictions: [{ member: 'process.platform', message: 'Use the runtime adapter instead.' }],
          }],
          errors: [
            error,
            { message: "'process.platform' may only appear in configured owner paths. Use the runtime adapter instead." },
          ],
        },
      ],
    },
  )
})
